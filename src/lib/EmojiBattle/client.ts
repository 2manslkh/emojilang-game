import type { Writable } from 'svelte/store';
import { get, writable } from 'svelte/store';
import type { Unit, UnitLevelData } from './types';
import { unitData } from './unitData';
import { nanoid } from 'nanoid';
import { gameLogger, playerLogger, battleLogger, aiLogger } from '../logging';
import { gameSettings } from './gameSettings';

export const attackingUnit = writable<Unit | null>(null);
export const attackingUnits = writable<[Unit | null, Unit | null]>([null, null]);

export class Game {
    players: [Player, Player];
    currentTurn: Writable<number>;
    gameOver: Writable<boolean>;
    units: Unit[];
    currentPhase: Writable<'preparation' | 'battle'>;
    phaseTimer: Writable<number>;

    constructor(player1: Player, player2: Player) {
        this.players = [player1, player2];
        this.currentTurn = writable(1);
        this.gameOver = writable(false);
        this.currentPhase = writable('preparation');
        this.phaseTimer = writable(gameSettings.PREPARATION_PHASE_DURATION);

        this.units = Object.values(unitData).map((data) => ({
            id: nanoid(),
            emoji: data.emoji,
            ...data.level_1,
            cost: data.cost,
            level: 1
        }));

        gameLogger.log('Game instance created');
    }

    startGame(): void {
        this.currentTurn.set(1);
        this.gameOver.set(false);
        this.currentPhase.set('preparation');
        this.phaseTimer.set(gameSettings.PREPARATION_PHASE_DURATION);
        this.startPhaseTimer();
        gameLogger.log('Game started');
        this.players[1].randomSummon(this);
        this.players[1].randomSummon(this);
        this.players[1].randomSummon(this);
    }

    startPhaseTimer(): void {
        gameLogger.log('Phase timer started');
        const timer = setInterval(() => {
            this.phaseTimer.update(t => {
                if (t <= 0) {
                    clearInterval(timer);
                    this.nextPhase();
                    return this.getCurrentPhaseDuration();
                }
                return t - 1;
            });
        }, 1000);
    }

    async nextPhase(): Promise<void> {
        gameLogger.log('Moving to next phase');
        const currentPhase = get(this.currentPhase);
        gameLogger.logData('Current phase before transition', { currentPhase });

        if (currentPhase === 'preparation') {
            this.currentPhase.set('battle');
            await this.battlePhase();
        } else {
            this.currentPhase.set('preparation');
            this.preparationPhase();
        }

        const newPhase = get(this.currentPhase);
        gameLogger.logData('New phase after transition', { newPhase });

        this.phaseTimer.set(this.getCurrentPhaseDuration());
        this.startPhaseTimer();
    }

    getCurrentPhase(): 'preparation' | 'battle' {
        gameLogger.log(`Current phase: ${get(this.currentPhase)}`);
        return get(this.currentPhase);
    }

    getCurrentPhaseDuration(): number {
        return get(this.currentPhase) === 'preparation'
            ? gameSettings.PREPARATION_PHASE_DURATION
            : gameSettings.BATTLE_PHASE_DURATION;
    }

    preparationPhase(): void {
        gameLogger.log('Entering preparation phase');
        this.currentTurn.update(t => t + 1);
        gameLogger.logData('Updated turn', { turn: get(this.currentTurn) });

        this.players.forEach((player) => {
            player.generateWheat();
            // Reset hasBattled for all units
            player.resetUnits();
            if (player.isAI) { // AI player (opponent)
                aiLogger.log('AI player turn');
                player.randomSummon(this);
            }
        });
        gameLogger.log(`Turn ${get(this.currentTurn)} started`);
    }

    async battlePhase(): Promise<void> {
        gameLogger.log('Entering battle phase');
        await Battle.resolveCombat(this.players[0], this.players[1]);
        if (this.checkVictoryCondition()) {
            this.endGame();
        }
    }

    checkVictoryCondition(): boolean {
        const result = this.players.some(player => get(player.state).health <= 0);
        gameLogger.log(`Checking victory condition: ${result}`);
        return result;
    }

    getWinner(): Player | null {
        const winner = this.players.find(player => get(player.state).health > 0) || null;
        gameLogger.log(`Winner: ${winner ? 'Player found' : 'No winner yet'}`);
        return winner;
    }

    endGame(): void {
        gameLogger.log('Game ended');
        this.gameOver.set(true);
    }

    canBuyUnits(): boolean {
        const currentPhase = get(this.currentPhase);
        gameLogger.logData('Checking if units can be bought', { currentPhase });
        return currentPhase === 'preparation';
    }
}

export class Player {
    isAI: boolean;
    state: Writable<{
        health: number;
        wheat: number;
        name: string;
        lastWheatGenerated: number;
        army: Unit[];
    }>;

    constructor(name: string, isAI: boolean = false) {
        this.isAI = isAI;
        this.state = writable({
            health: gameSettings.INITIAL_PLAYER_HEALTH,
            wheat: gameSettings.INITIAL_PLAYER_WHEAT,
            lastWheatGenerated: 0,
            name: name || 'Player',
            army: []
        });
        if (name === 'Player') {
            playerLogger.log('Player instance created');
        } else {
            aiLogger.log('AI instance created');
        }
    }

    calculateWheatBoost(): number {
        const state = get(this.state);
        const baseWheatGeneration = gameSettings.BASE_WHEAT_GENERATION;

        // Calculate additional wheat from unit abilities
        const abilityWheatBoost = state.army.reduce((total, unit) => {
            const wheatGenerationAbility = unit.abilities?.find(ability => ability.name === 'wheatGeneration');
            return total + (wheatGenerationAbility?.value || 0);
        }, 0);

        const totalWheatGeneration = baseWheatGeneration + abilityWheatBoost;

        playerLogger.logData('Calculating wheat boost', {
            baseWheatGeneration,
            abilityWheatBoost,
            totalWheatGeneration
        });

        return totalWheatGeneration;
    }

    generateWheat(): void {
        playerLogger.log('Generating wheat');
        this.state.update(s => {
            const wheatBoost = this.calculateWheatBoost();
            const newWheat = s.wheat + wheatBoost;
            const lastWheatGenerated = wheatBoost;
            playerLogger.logData('Generating wheat', {
                oldWheat: s.wheat,
                wheatBoost,
                newWheat
            });
            return {
                ...s,
                lastWheatGenerated,
                wheat: newWheat
            };
        });
    }

    getLastWheatGenerated(): number {
        return get(this.state).lastWheatGenerated;
    }

    summonUnit(unitName: string, game: Game): void {
        playerLogger.logData('Attempting to summon unit', { unitName });
        if (!game.canBuyUnits()) {
            playerLogger.log('Cannot buy units during battle phase');
            return;
        }
        const unitInfo = unitData[unitName];
        playerLogger.logData('Unit info', { unitInfo });
        if (!unitInfo || !unitInfo.level_1) return;

        this.state.update(s => {
            if (s.wheat >= unitInfo.cost) {
                playerLogger.logData('Summoning unit', { unitName });
                const newUnit: Unit = {
                    id: nanoid(),
                    emoji: unitInfo.emoji,
                    ...unitInfo.level_1,
                    cost: unitInfo.cost,
                    level: 1
                };
                return {
                    ...s,
                    wheat: s.wheat - unitInfo.cost,
                    army: [...s.army, newUnit]
                };
            } else {
                playerLogger.log('Not enough wheat to summon unit');
            }
            return s;
        });
    }

    // AI ONLY
    randomSummon(game: Game): void {
        aiLogger.log('AI attempting to summon a random unit');
        const currentPhase = get(game.currentPhase);
        aiLogger.logData('Current game phase', { phase: currentPhase });

        if (!game.canBuyUnits()) {
            aiLogger.log('Cannot summon random unit during battle phase');
            return;
        }

        const affordableUnits = Object.entries(unitData).filter(([, data]) => {
            return get(this.state).wheat >= data.cost;
        });

        aiLogger.logData('Affordable units', { affordableUnits: affordableUnits.map(([name]) => name) });

        if (affordableUnits.length === 0) {
            aiLogger.log('No affordable units available for AI random summon');
            return;
        }

        const randomIndex = Math.floor(Math.random() * affordableUnits.length);
        const [unitName] = affordableUnits[randomIndex];

        this.summonUnit(unitName, game);
        aiLogger.logData('AI randomly summoned unit', { unitName });
    }

    rearrangeArmy(newArmy: Unit[]): void {
        playerLogger.log('Rearranging army');
        this.state.update(s => ({ ...s, army: newArmy }));
    }

    upgradeUnit(unit: Unit): void {
        playerLogger.log(`Attempting to upgrade unit: ${unit.name}`);
        const unitInfo = unitData[unit.name];
        if (!unitInfo || unit.level >= 3) return;

        const nextLevel = unit.level + 1 as 2 | 3;
        const nextLevelData = unitInfo[`level_${nextLevel}`] as UnitLevelData | undefined;
        if (!nextLevelData) return;

        const upgradedUnit: Unit = {
            ...unit,
            ...nextLevelData,
            level: nextLevel
        };

        this.state.update(s => ({
            ...s,
            army: s.army.map(u => u.id === unit.id ? upgradedUnit : u)
        }));
    }

    takeDamage(damage: number): void {
        playerLogger.log(`Player taking ${damage} damage`);
        this.state.update(s => ({
            ...s,
            health: Math.max(0, s.health - damage)
        }));
    }

    resetUnits(): void {
        playerLogger.log('Resetting units to original state');
        this.state.update(s => ({
            ...s,
            army: s.army.map(unit => ({ ...unit, hasBattled: false }))
        }));
    }
}

class Battle {
    static async resolveCombat(player1: Player, player2: Player): Promise<void> {
        battleLogger.log('Resolving combat');
        const player1Army = get(player1.state).army;
        const player2Army = get(player2.state).army;
        const maxBattles = Math.max(player1Army.length, player2Army.length);

        for (let i = 0; i < maxBattles; i++) {
            const unit1 = player1Army[i];
            const unit2 = player2Army[i];

            if (unit1 && unit2) {
                await Battle.performSimultaneousBattle(unit1, unit2, player1, player2);
            } else if (unit1) {
                await Battle.performAttack(unit1, player2);
            } else if (unit2) {
                await Battle.performAttack(unit2, player1);
            }

            // Check if the battle should end after each round
            if (Battle.shouldEndBattle(player1, player2)) {
                break;
            }
        }
    }

    static async performSimultaneousBattle(unit1: Unit, unit2: Unit, player1: Player, player2: Player): Promise<void> {
        battleLogger.log(`${unit1.name} and ${unit2.name} clashing`);

        attackingUnits.set([unit1, unit2]);
        await new Promise(resolve => setTimeout(resolve, gameSettings.BATTLE_DELAY));

        // Both units deal damage simultaneously
        const damage1 = unit1.attack;
        const damage2 = unit2.attack;

        unit2.health -= damage1;
        unit1.health -= damage2;

        // Mark units as battled
        unit1.hasBattled = true;
        unit2.hasBattled = true;

        battleLogger.log(`${unit1.name} deals ${damage1} damage to ${unit2.name}`);
        battleLogger.log(`${unit2.name} deals ${damage2} damage to ${unit1.name}`);

        // Check if units are defeated
        const promises = [];
        if (unit1.health <= 0) {
            promises.push(Battle.removeDefeatedUnit(player1, unit1));
        }
        if (unit2.health <= 0) {
            promises.push(Battle.removeDefeatedUnit(player2, unit2));
        }

        await Promise.all(promises);

        attackingUnits.set([null, null]);
    }

    static async performAttack(attacker: Unit, targetPlayer: Player): Promise<void> {
        attackingUnits.set([attacker, null]);
        await new Promise(resolve => setTimeout(resolve, gameSettings.BATTLE_DELAY));

        battleLogger.log(`${attacker.name} attacking ${get(targetPlayer.state).name} directly for ${attacker.attack} damage`);
        targetPlayer.takeDamage(attacker.attack);

        // Mark unit as battled
        attacker.hasBattled = true;

        attackingUnits.set([null, null]);
    }

    static async removeDefeatedUnit(player: Player, defeatedUnit: Unit): Promise<void> {
        battleLogger.log(`Removing defeated unit: ${defeatedUnit.name} from ${get(player.state).name}'s army`);
        player.state.update(s => ({
            ...s,
            army: s.army.filter(unit => unit.id !== defeatedUnit.id)
        }));
    }

    static shouldEndBattle(player1: Player, player2: Player): boolean {
        return get(player1.state).health <= 0 || get(player2.state).health <= 0;
    }
}

