import type { Writable } from 'svelte/store';
import { get, writable } from 'svelte/store';
import type { Unit } from './types';
import { unitData } from './unitData';
import { nanoid } from 'nanoid';
import { gameLogger, playerLogger, battleLogger } from '../logging';

// Remove the UnitData import as it's not used
// import type { Unit, UnitData } from './types';

// Create debug loggers

export class Game {
    players: [Player, Player];
    currentTurn: Writable<number>;
    gameOver: Writable<boolean>;
    units: Unit[];
    currentPhase: Writable<'preparation' | 'battle'>;
    phaseTimer: Writable<number>;
    readonly PHASE_DURATION = 10; // 10 seconds per phase

    constructor(player1: Player, player2: Player) {
        this.players = [player1, player2];
        this.currentTurn = writable(1);
        this.gameOver = writable(false);
        this.currentPhase = writable('preparation');
        this.phaseTimer = writable(this.PHASE_DURATION);

        this.units = Object.values(unitData).map(unit => ({
            id: nanoid(),
            emoji: unit.emoji,
            name: unit.name,
            attack: unit.attack,
            health: unit.health,
            cost: unit.cost,
            level: unit.level,
            abilities: unit.abilities
        }));
        gameLogger.log('Game instance created');
    }

    startGame(): void {
        this.currentTurn.set(1);
        this.gameOver.set(false);
        this.currentPhase.set('preparation');
        this.phaseTimer.set(this.PHASE_DURATION);
        this.startPhaseTimer();
        gameLogger.log('Game started');
    }

    startPhaseTimer(): void {
        gameLogger.log('Phase timer started');
        const timer = setInterval(() => {
            this.phaseTimer.update(t => {
                if (t <= 0) {
                    clearInterval(timer);
                    this.nextPhase();
                    return this.PHASE_DURATION;
                }
                return t - 1;
            });
        }, 1000);
    }

    nextPhase(): void {
        gameLogger.log('Moving to next phase');
        this.currentPhase.update(phase => {
            if (phase === 'preparation') {
                this.battlePhase();
                return 'battle';
            } else {
                this.preparationPhase();
                this.currentTurn.update(t => t + 1);
                return 'preparation';
            }
        });
        this.startPhaseTimer();
    }

    getCurrentPhase(): 'preparation' | 'battle' {
        gameLogger.log(`Current phase: ${get(this.currentPhase)}`);
        return get(this.currentPhase);
    }

    preparationPhase(): void {
        gameLogger.log('Entering preparation phase');
        this.players.forEach(player => player.generateWheat());
        // Players can summon or merge units during this phase
    }

    battlePhase(): void {
        gameLogger.log('Entering battle phase');
        Battle.resolveCombat(this.players[0], this.players[1]);
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
}

export class Player {
    state: Writable<{
        health: number;
        wheat: number;
        farmers: number;
        army: Unit[];
    }>;

    constructor() {
        this.state = writable({
            health: 100,
            wheat: 10,
            farmers: 2,
            army: []
        });
        playerLogger.log('Player instance created');
    }

    generateWheat(): void {
        playerLogger.log('Generating wheat');
        this.state.update(s => ({
            ...s,
            wheat: s.wheat + s.farmers * 2
        }));
    }

    summonUnit(unitName: string): void {
        playerLogger.logData('Attempting to summon unit', { unitName });
        const unitInfo = unitData[unitName];
        playerLogger.logData('Unit info', { unitInfo });
        if (!unitInfo) return;

        this.state.update(s => {
            if (s.wheat >= unitInfo.cost) {
                return {
                    ...s,
                    wheat: s.wheat - unitInfo.cost,
                    army: [...s.army, { ...unitInfo, level: 1, id: nanoid() }]
                };
            }
            return s;
        });
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
        const upgradedUnit = {
            ...unit,
            ...unitInfo[`level${nextLevel}`],
            level: nextLevel
        };

        this.state.update(s => ({
            ...s,
            army: s.army.map(u => u === unit ? upgradedUnit : u)
        }));
    }

    takeDamage(damage: number): void {
        playerLogger.log(`Player taking ${damage} damage`);
        this.state.update(s => ({
            ...s,
            health: Math.max(0, s.health - damage)
        }));
    }
}

class Battle {
    static resolveCombat(player1: Player, player2: Player): void {
        battleLogger.log('Resolving combat');
        const attackOrder = [...get(player1.state).army, ...get(player2.state).army].sort((a, b) => b.attack - a.attack);

        for (const unit of attackOrder) {
            const isPlayer1Unit = get(player1.state).army.includes(unit);
            const target = Battle.findTarget(unit, isPlayer1Unit ? player2 : player1);
            Battle.performAttack(unit, target);
        }
    }

    static findTarget(unit: Unit, opponent: Player): Unit | Player {
        battleLogger.logData('Finding target for unit', { unitName: unit.name });
        const opponentArmy = get(opponent.state).army;
        if (opponentArmy.length > 0) {
            return Battle.findBestTarget(unit, opponentArmy);
        } else {
            return opponent;
        }
    }

    static findBestTarget(attackingUnit: Unit, enemyUnits: Unit[]): Unit {
        battleLogger.log(`Finding best target for unit: ${attackingUnit.name} `);
        // Implement logic to find the best target based on class counters
        // For now, just return the first unit
        return enemyUnits[0];
    }

    static performAttack(attacker: Unit, target: Unit | Player): void {
        battleLogger.log(`${attacker.name} attacking ${target instanceof Player ? 'Player' : target.name} `);
        if (target instanceof Player) {
            target.takeDamage(attacker.attack);
        } else {
            target.health -= attacker.attack;
            if (target.health <= 0) {
                // Remove the defeated unit from the player's army
                // This logic needs to be implemented
            }
        }
    }
}

export function simulateGame(maxTurns: number = 100): { winner: Player | null, turns: number } {
    gameLogger.logData('Simulating game', { maxTurns });
    const player1 = new Player();
    const player2 = new Player();
    const game = new Game(player1, player2);
    let turns = 0;

    game.startGame();

    while (!get(game.gameOver) && turns < maxTurns) {
        game.nextPhase();
        turns++;
    }

    return { winner: game.getWinner(), turns };
}
