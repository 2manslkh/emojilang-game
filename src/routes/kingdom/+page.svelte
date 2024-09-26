<script lang="ts">
	import { Game, Player } from '$lib/EmojiBattle/client';
	import { onMount } from 'svelte';
	import type { Unit } from '$lib/EmojiBattle/types';
	import UnitCard from '$components/Card/UnitCard.svelte';
	import { get } from 'svelte/store';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';

	let game: Game;
	let player: Player;
	let opponent: Player;
	let turn: number;
	let units: Unit[] = [];
	let currentPhase: 'preparation' | 'battle';
	let phaseTimer: number;

	onMount(() => {
		player = new Player();
		opponent = new Player();
		game = new Game(player, opponent);
		game.startGame();

		game.currentTurn.subscribe((value) => (turn = value));
		game.currentPhase.subscribe((value) => (currentPhase = value));
		game.phaseTimer.subscribe((value) => (phaseTimer = value));
		units = game.units;
	});

	function buyUnit(unitName: string) {
		player.summonUnit(unitName);
	}

	function nextTurn() {
		game?.nextPhase();
	}

	function handleDndConsider(e: CustomEvent<DndEvent<Unit>>) {
		playerArmy = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Unit>>) {
		playerArmy = e.detail.items;
		player.rearrangeArmy(playerArmy);
	}

	$: playerHealth = get(player?.health) ?? 0;
	$: playerWheat = get(player?.wheat) ?? 0;
	$: playerArmy = get(player?.army) ?? [];
	$: opponentHealth = get(opponent?.health) ?? 0;
	$: opponentWheat = get(opponent?.wheat) ?? 0;
	$: opponentArmy = get(opponent?.army) ?? [];
	$: gameOver = get(game?.gameOver) ?? false;
</script>

<div class="container mx-auto p-4 max-w-3xl">
	{#if game && player && opponent}
		<div class="flex justify-between items-center mb-4">
			<div>
				<h2 class="text-xl font-semibold">Enemy</h2>
				<p>🏰❤️: {opponentHealth}</p>
				<p>🌾: {opponentWheat}</p>
			</div>
			<div class="text-center">
				<h2 class="text-xl font-semibold">Turn {turn}</h2>
				<p class="text-lg">Phase: {currentPhase}</p>
				<p class="text-lg">Time: {phaseTimer}s</p>
				<div class="w-48 h-4 bg-gray-200 rounded-full mt-2">
					<div
						class="h-full bg-blue-500 rounded-full"
						style="width: {(phaseTimer / game.PHASE_DURATION) * 100}%"
					></div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-6 gap-2 mb-4">
			{#each units as unit}
				<UnitCard {unit} count={opponentArmy.filter((u) => u.name === unit.name).length} />
			{/each}
		</div>

		<div class="grid grid-cols-6 gap-2 mb-4">
			{#each units as unit}
				<UnitCard {unit} count={playerArmy.filter((u) => u.name === unit.name).length} />
			{/each}
		</div>

		<div class="flex justify-between items-center mb-4">
			<div>
				<h2 class="text-xl font-semibold">Player</h2>
				<p>🏰❤️: {playerHealth}</p>
				<p>🌾: {playerWheat}</p>
			</div>
			<button
				class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
				on:click={nextTurn}
			>
				Next Phase
			</button>
		</div>

		<div class="bg-gray-100 p-4 rounded-lg">
			<h2 class="text-xl font-semibold mb-2">Shop</h2>
			<div class="grid grid-cols-3 gap-2">
				{#each units as unit}
					<UnitCard {unit} showCost={true} onClick={() => buyUnit(unit.name)} />
				{/each}
			</div>
		</div>

		<div class="grid grid-cols-6 gap-2 mb-4">
			{#each opponentArmy as unit}
				<UnitCard {unit} />
			{/each}
		</div>

		<div
			class="grid grid-cols-6 gap-2 mb-4"
			use:dndzone={{ items: playerArmy, flipDurationMs: 300 }}
			on:consider={handleDndConsider}
			on:finalize={handleDndFinalize}
		>
			{#each playerArmy as unit (unit.id)}
				<div animate:flip={{ duration: 300 }}>
					<UnitCard {unit} />
				</div>
			{/each}
		</div>

		{#if gameOver}
			<div class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
				<h2 class="text-xl font-semibold">Game Over!</h2>
				<p>Winner: {game.getWinner() === player ? 'Player' : 'Opponent'}</p>
			</div>
		{/if}
	{:else}
		<p>Loading game...</p>
	{/if}
</div>
