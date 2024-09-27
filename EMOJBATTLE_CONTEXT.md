# Auto Emoji Battle - Typescript SDK Documentation

## Overview

The Auto Emoji Battle game is implemented as a Typescript SDK that simulates and manages the game, allowing developers to interact with game elements such as players, units, resources (Wheat), and game phases. The SDK handles core game mechanics including combat resolution, unit summoning, merging, and resource management.

## Game Rules

- Players start with 100 HP and aim to reduce their opponent's HP to 0.
- The game alternates between 10-second Preparation and Battle phases.
- Players generate Wheat each turn, with Farmers potentially increasing this amount.
- Units are summoned using Wheat during the Preparation phase.
- Units can be upgraded to create stronger versions during the Preparation phase.
- Combat occurs automatically during the Battle phase, with units fighting based on their attack power.

## Core Components

### 1. Game State Management

The SDK manages the overall state of the game, including players, units, and turns. The **Game** class orchestrates the flow, while **Player** and **Unit** classes hold specific player and unit data.

#### Game Class

```typescript
class Game {
	players: [Player, Player];
	currentTurn: Writable<number>;
	gameOver: Writable<boolean>;
	units: Unit[];
	currentPhase: Writable<'preparation' | 'battle'>;
	phaseTimer: Writable<number>;
	readonly PHASE_DURATION = 10; // 10 seconds per phase

	constructor(player1: Player, player2: Player);
	startGame(): void;
	startPhaseTimer(): void;
	nextPhase(): void;
	getCurrentPhase(): 'preparation' | 'battle';
	preparationPhase(): void;
	battlePhase(): void;
	checkVictoryCondition(): boolean;
	getWinner(): Player | null;
	endGame(): void;
	canBuyUnits(): boolean;
}
```

#### Player Class

```typescript
class Player {
	isAI: boolean;
	state: Writable<{
		health: number;
		wheat: number;
		farmers: number;
		name: string;
		army: Unit[];
	}>;

	constructor(name: string, isAI: boolean = false);
	calculateWheatBoost(): number;
	generateWheat(): void;
	summonUnit(unitName: string, game: Game): void;
	randomSummon(game: Game): void; // AI only
	rearrangeArmy(newArmy: Unit[]): void;
	upgradeUnit(unit: Unit): void;
	takeDamage(damage: number): void;
}
```

#### Unit Interface

```typescript
interface Unit {
	id: string;
	emoji: string;
	name: string;
	attack: number;
	health: number;
	cost: number;
	level: number;
	abilities?: Ability[];
}
```

### 2. Game Phases

Each game turn is divided into two phases:

- Preparation Phase (10 seconds):
  - Players spend Wheat to summon or upgrade units.
  - Players can rearrange their army.
- Battle Phase (10 seconds):
  - Units automatically attack based on their attack power.
  - Combat is resolved based on unit stats and abilities.

### 3. Unit Types and Abilities

The game includes various unit types (Farmer, Melee, Ranged, Magic, Assassin) with their respective stats and abilities. These are defined in the `unitData.ts` file.

### 4. Combat Logic

During the Battle Phase, units attack based on their attack power. The `Battle` class handles combat resolution, including finding targets and performing attacks.

### 5. Unit Upgrading Logic

Players can upgrade units to create stronger versions during the Preparation Phase. This is handled by the `upgradeUnit` method in the `Player` class.

### 6. Wheat Generation and Management

Wheat generation is implemented in the `Player` class, with bonuses from Farmer units taken into account.

### 7. Victory Condition

The game ends when a player's HP reaches 0. This is checked after each Battle Phase.

### 8. Additional Features

- Unit abilities are implemented as defined in the `unitData.ts` file.
- The game includes an AI opponent that can make random unit summons.
- The SDK uses Svelte stores for reactive state management.

## Implementation Notes

- The game uses a Typescript/Svelte framework.
- Unit data is stored in a separate `unitData.ts` file for easy management and updates.
- The SDK includes logging functionality for debugging and monitoring game events.
- The game UI is implemented separately, allowing for flexible frontend integration.

This SDK provides a comprehensive framework for the Auto Emoji Battle game, handling core game mechanics while allowing for easy integration with various frontend implementations.
