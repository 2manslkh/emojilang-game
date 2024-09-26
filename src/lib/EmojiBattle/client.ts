import type { Writable } from 'svelte/store';
import { get, writable } from 'svelte/store';
import type { Unit, UnitData } from './types';
import { unitData } from './unitData';
import { nanoid } from 'nanoid';

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
    }

    startGame(): void {
        this.currentTurn.set(1);
        this.gameOver.set(false);
        this.currentPhase.set('preparation');
        this.phaseTimer.set(this.PHASE_DURATION);
        this.startPhaseTimer();
    }

    startPhaseTimer(): void {
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
        return get(this.currentPhase);
    }

    preparationPhase(): void {
        this.players.forEach(player => player.generateWheat());
        // Players can summon or merge units during this phase
    }

    battlePhase(): void {
        Battle.resolveCombat(this.players[0], this.players[1]);
        if (this.checkVictoryCondition()) {
            this.endGame();
        }
    }

    checkVictoryCondition(): boolean {
        return this.players.some(player => get(player.health) <= 0);
    }

    getWinner(): Player | null {
        if (!get(this.gameOver)) return null;
        return this.players.find(player => get(player.health) > 0) || null;
    }

    endGame(): void {
        this.gameOver.set(true);
    }
}

export class Player {
    health: Writable<number>;
    wheat: Writable<number>;
    farmers: Writable<number>;
    army: Writable<Unit[]>;

    constructor() {
        this.health = writable(100);
        this.wheat = writable(10);
        this.farmers = writable(2);
        this.army = writable([]);
    }

    generateWheat(): void {
        this.wheat.update(w => w + get(this.farmers) * 2);
    }

    summonUnit(unitName: string): void {
        const unitInfo = unitData[unitName];
        if (!unitInfo) return;

        this.wheat.update(w => {
            if (w >= unitInfo.cost) {
                w -= unitInfo.cost;
                this.army.update(army => [...army, { ...unitInfo, level: 1, id: nanoid() }]);
            }
            return w;
        });
    }

    rearrangeArmy(newArmy: Unit[]): void {
        this.army.set(newArmy);
    }

    upgradeUnit(unit: Unit): void {
        const unitInfo = unitData[unit.name];
        if (!unitInfo || unit.level >= 3) return;

        const nextLevel = unit.level + 1 as 2 | 3;
        const upgradedUnit = {
            ...unit,
            ...unitInfo[`level${nextLevel}`],
            level: nextLevel
        };

        this.army.update(army => army.map(u => u === unit ? upgradedUnit : u));
    }

    takeDamage(damage: number): void {
        this.health.update(h => Math.max(0, h - damage));
    }
}

class Battle {
    static resolveCombat(player1: Player, player2: Player): void {
        const attackOrder = [...get(player1.army), ...get(player2.army)].sort((a, b) => b.attack - a.attack);

        for (const unit of attackOrder) {
            const isPlayer1Unit = get(player1.army).includes(unit);
            const target = Battle.findTarget(unit, isPlayer1Unit ? player2 : player1);
            Battle.performAttack(unit, target);
        }
    }

    static findTarget(unit: Unit, opponent: Player): Unit | Player {
        const opponentArmy = get(opponent.army);
        if (opponentArmy.length > 0) {
            return Battle.findBestTarget(unit, opponentArmy);
        } else {
            return opponent;
        }
    }

    static findBestTarget(attackingUnit: Unit, enemyUnits: Unit[]): Unit {
        // Implement logic to find the best target based on class counters
        // For now, just return the first unit
        return enemyUnits[0];
    }

    static performAttack(attacker: Unit, target: Unit | Player): void {
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
