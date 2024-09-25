import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import type { Player, Unit } from './types';

export class EmojiKingdom {
    player: Writable<Player>;
    opponent: Writable<Player>;
    turn: Writable<number>;
    units: Unit[];

    constructor() {
        this.player = writable({
            castle: { health: 100 },
            wheat: 10,
            farmers: 2,
            army: [],
        });

        this.opponent = writable({
            castle: { health: 100 },
            wheat: 10,
            farmers: 2,
            army: [],
        });

        this.turn = writable(1);

        this.units = [
            { emoji: '👨‍🌾', name: 'Farmer', attack: 1, health: 2, cost: 5 },
            { emoji: '⚔️', name: 'Swordsman', attack: 3, health: 5, cost: 10 },
            { emoji: '🏹', name: 'Archer', attack: 2, health: 3, cost: 8 },
            { emoji: '🐎', name: 'Knight', attack: 4, health: 6, cost: 15 },
            { emoji: '🧙‍♂️', name: 'Wizard', attack: 5, health: 4, cost: 20, ability: 'AOE Damage' },
        ];
    }

    buyUnit(unitName: string) {
        const unit = this.units.find(u => u.name === unitName);
        if (!unit) return;

        this.player.update(p => {
            if (p.wheat >= unit.cost) {
                p.wheat -= unit.cost;
                p.army.push({ ...unit });
            }
            return p;
        });
    }

    nextTurn() {
        this.turn.update(t => t + 1);
        this.generateWheat();
        this.battle();
    }

    generateWheat() {
        this.player.update(p => {
            p.wheat += p.farmers * 2;
            return p;
        });
        this.opponent.update(o => {
            o.wheat += o.farmers * 2;
            return o;
        });
    }

    battle() {
        // Implement battle logic here
        // This is a simplified version, you may want to expand on this
        this.player.update(p => {
            const totalDamage = p.army.reduce((sum, unit) => sum + unit.attack, 0);
            this.opponent.update(o => {
                o.castle.health = Math.max(0, o.castle.health - totalDamage);
                return o;
            });
            return p;
        });

        // Opponent's turn (simplified AI)
        this.opponent.update(o => {
            const totalDamage = o.army.reduce((sum, unit) => sum + unit.attack, 0);
            this.player.update(p => {
                p.castle.health = Math.max(0, p.castle.health - totalDamage);
                return p;
            });
            return o;
        });
    }

    simulateOpponentTurn() {
        this.opponent.update(o => {
            // Simple AI: buy the most expensive unit it can afford
            const affordableUnits = this.units.filter(unit => unit.cost <= o.wheat);
            if (affordableUnits.length > 0) {
                const mostExpensiveUnit = affordableUnits.reduce((prev, current) =>
                    (prev.cost > current.cost) ? prev : current
                );
                o.wheat -= mostExpensiveUnit.cost;
                o.army.push({ ...mostExpensiveUnit });
            }
            return o;
        });
    }

    isGameOver(): boolean {
        let playerHealth: number = 0;
        let opponentHealth: number = 0;

        this.player.subscribe(p => playerHealth = p.castle.health);
        this.opponent.subscribe(o => opponentHealth = o.castle.health);

        return playerHealth <= 0 || opponentHealth <= 0;
    }

    getWinner(): 'player' | 'opponent' | null {
        if (!this.isGameOver()) return null;

        let playerHealth: number = 0;
        let opponentHealth: number = 0;

        this.player.subscribe(p => playerHealth = p.castle.health);
        this.opponent.subscribe(o => opponentHealth = o.castle.health);

        if (playerHealth <= 0) return 'opponent';
        if (opponentHealth <= 0) return 'player';
        return null;
    }

    getUnits(): Unit[] {
        return this.units;
    }
}

export function simulateGame(maxTurns: number = 100): { winner: 'player' | 'opponent' | 'draw', turns: number } {
    const game = new EmojiKingdom();
    let turns = 0;

    while (!game.isGameOver() && turns < maxTurns) {
        // Player's turn
        const playerUnit = game.units[Math.floor(Math.random() * game.units.length)];
        game.buyUnit(playerUnit.name);

        // Opponent's turn
        game.simulateOpponentTurn();

        game.nextTurn();
        turns++;
    }

    const winner = game.getWinner();
    return { winner: winner || 'draw', turns };
}
