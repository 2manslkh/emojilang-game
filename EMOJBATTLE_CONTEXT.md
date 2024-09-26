# Auto Emoji Battle - Typescript SDK Documentation

## Overview

The goal is to create a Typescript SDK that simulates and manages the **Auto Emoji Battle** game, allowing developers to interact with game elements such as players, units, resources (Wheat), and game phases. The SDK will handle all the core game mechanics including combat resolution, unit summoning, merging, and resource management.

## Core Components

### 1. **Game State Management:**

The SDK manages the overall state of the game, including players, units, and turns. The **Game** class orchestrates the flow, while **Player** and **Unit** classes hold specific player and unit data.

#### **Game Class**

```typescript
class Game {
	players: Player[];
	currentTurn: number;
	gameOver: boolean;

	constructor(player1: Player, player2: Player);

	startGame(): void;
	endGame(): void;
	nextTurn(): void; // Switches between preparation and battle phases.
	checkVictoryCondition(): boolean; // Checks if a player's health reaches 0.
}
```

```typescript
class Player {
	health: number;
	wheat: number;
	units: Unit[];
	farmerCount: number; // Tracks Wheat production from Farmers.

	constructor();

	generateWheat(): void; // Adds Wheat per turn and accounts for Farmers.
	summonUnit(unitType: string): Unit | null; // Summons a new unit if Wheat cost is met.
	mergeUnits(unitType: string): void; // Merges two units of the same type to upgrade.
	takeDamage(damage: number): void; // Deducts health when attacked by units.
}
```

```typescript
class Unit {
	type: string; // E.g., "Skirmisher", "Swordsman", "Brute", etc.
	attack: number;
	health: number;
	cost: number; // Wheat cost to summon.
	level: number; // Levels 1, 2, or 3.

	constructor(type: string, level: number);

	attackEnemy(target: Unit | Player): void; // Attacks an enemy unit or player.
	takeDamage(damage: number): void; // Reduces health after taking damage.
	canMergeWith(unit: Unit): boolean; // Checks if the unit can merge with another.
	upgrade(): void; // Handles stat upgrades during merging.
}
```

### 2. Game Phases

Each game turn is divided into two phases:

• Preparation Phase (10 seconds):
• Players spend Wheat to summon or merge units.
• Players can manage the battlefield and upgrade units.
• Battle Phase (10 seconds):
• Units automatically attack based on class counters:
• Melee counters Magic.
• Magic counters Ranged.
• Ranged counters Melee.
• Assassins attack Farmers.
• Units will only attack the player if the player has no units left on the battlefield.

### 3. Classes and Methods Breakdown

Unit Types and Abilities

Unit stats and abilities differ based on the class. The UnitFactory helps create units at different levels with corresponding stats and abilities.

```typescript
const unitData = {
	skirmisher: {
		level1: { attack: 1, health: 1, cost: 1 },
		level2: { attack: 3, health: 3 },
		level3: { attack: 8, health: 8 }
	},
	swordsman: {
		level1: { attack: 2, health: 2, cost: 2 },
		level2: { attack: 4, health: 6, special: '+1 attack per turn' },
		level3: { attack: 8, health: 16, special: '+2 attack per turn' }
	}
	// Add more units here...
};

class UnitFactory {
	static createUnit(type: string, level: number): Unit {
		const stats = unitData[type][`level${level}`];
		return new Unit(type, level, stats.attack, stats.health, stats.cost);
	}
}
```

### 4. Combat Logic

During the Battle Phase, units will automatically attack based on their class priority and available targets. If no units remain on the opponent’s field, the player will be attacked directly.

```typescript
class Battle {
	static resolveCombat(player1: Player, player2: Player): void {
		// Player 1 units attack Player 2's units
		player1.units.forEach((unit) => {
			const target = Battle.findTarget(unit, player2);
			unit.attackEnemy(target);
		});

		// Player 2 units attack Player 1's units
		player2.units.forEach((unit) => {
			const target = Battle.findTarget(unit, player1);
			unit.attackEnemy(target);
		});
	}

	static findTarget(unit: Unit, opponent: Player): Unit | Player {
		// Check if the opponent has units on the field
		if (opponent.units.length > 0) {
			// Find the best unit to attack based on class counters (to be implemented)
			return Battle.findBestTarget(unit, opponent.units);
		} else {
			// No units on the field, attack the player directly
			return opponent;
		}
	}

	static findBestTarget(attackingUnit: Unit, enemyUnits: Unit[]): Unit {
		// Implement logic to find the best target based on class counters
		// Example: Melee > Magic > Ranged
		return enemyUnits[0]; // Placeholder for now, prioritize based on counters
	}
}
```

### 5. Unit Merging Logic

When players have two units of the same type and level, they can merge them into a higher-level unit.

```typescript
class MergeMechanism {
	static mergeUnits(player: Player, unitType: string): void {
		const units = player.units.filter((u) => u.type === unitType && u.level === 1);
		if (units.length >= 2) {
			player.units = player.units.filter((u) => u !== units[0] && u !== units[1]);
			const mergedUnit = UnitFactory.createUnit(unitType, 2);
			player.units.push(mergedUnit);
		}
	}
}
```

### 6. Summoning and Wheat Management

Players can summon units by spending Wheat. The summoning method deducts the Wheat cost and adds the summoned unit to the player’s army.

```typescript
class SummonMechanism {
	static summon(player: Player, unitType: string): void {
		const unitCost = unitData[unitType].level1.cost;
		if (player.wheat >= unitCost) {
			const newUnit = UnitFactory.createUnit(unitType, 1);
			player.units.push(newUnit);
			player.wheat -= unitCost;
		}
	}
}
```

### 7. Turn and Victory Management

Each turn alternates between the preparation phase and battle phase. The game ends when a player’s HP reaches 0.

```typescript
class TurnManager {
	static nextTurn(game: Game): void {
		if (game.currentTurn % 2 === 0) {
			game.players.forEach((player) => player.generateWheat());
			// Players can summon or merge units during this phase.
		} else {
			Battle.resolveCombat(game.players[0], game.players[1]);
			if (game.checkVictoryCondition()) {
				game.endGame();
			}
		}
		game.currentTurn++;
	}
}
```

### 8. Additional Features

• Player Targeting: The Catapult should deal 2x damage to the player if the player is targeted directly, with no splash damage to other units.
• Unit Stats and Balancing: Adjust unit stats and special abilities for balance, ensuring all units are viable and useful in different strategies.

### 9. Example Usage

```typescript
// Create a new game
const player1 = new Player();
const player2 = new Player();
const game = new Game(player1, player2);

// Start the game
game.startGame();

// On each turn:
TurnManager.nextTurn(game);
```

This SDK provides the foundation for Auto Emoji Battle, allowing developers to simulate game logic and customize mechanics through Typescript. The core elements like summoning, merging, and battle resolution are all handled within the SDK.
