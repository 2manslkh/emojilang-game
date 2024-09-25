<script lang="ts">
	import { EmojiKingdom } from '$lib/EmojiBattle/client';
	import { onMount } from 'svelte';
	import type { Player, Unit } from '$lib/EmojiBattle/types';
	import UnitCard from '$components/Card/UnitCard.svelte';

	let game: EmojiKingdom;
	let player: Player;
	let opponent: Player;
	let turn: number;
	let units: Unit[] = [];

	onMount(() => {
		game = new EmojiKingdom();
		game.player.subscribe((value) => (player = value));
		game.opponent.subscribe((value) => (opponent = value));
		game.turn.subscribe((value) => (turn = value));
		units = game.getUnits();
	});

	function buyUnit(unitName: string) {
		game?.buyUnit(unitName);
	}

	function nextTurn() {
		game?.nextTurn();
	}
</script>

<div class="container mx-auto p-4 max-w-3xl">
	{#if game && player && opponent}
		<div class="flex justify-between items-center mb-4">
			<div>
				<h2 class="text-xl font-semibold">Enemy</h2>
				<p>🏰❤️: {opponent.castle.health}</p>
				<p>🌾: {opponent.wheat}</p>
			</div>
			<div class="text-center">
				<h2 class="text-xl font-semibold">Turn {turn}</h2>
				<div class="w-48 h-4 bg-gray-200 rounded-full mt-2">
					<div class="w-3/4 h-full bg-blue-500 rounded-full"></div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-6 gap-2 mb-4">
			{#each units as unit}
				<UnitCard {unit} count={opponent.army.filter((u) => u.name === unit.name).length} />
			{/each}
		</div>

		<div class="grid grid-cols-6 gap-2 mb-4">
			{#each units as unit}
				<UnitCard {unit} count={player.army.filter((u) => u.name === unit.name).length} />
			{/each}
		</div>

		<div class="flex justify-between items-center mb-4">
			<div>
				<h2 class="text-xl font-semibold">Player</h2>
				<p>🏰❤️: {player.castle.health}</p>
				<p>🌾: {player.wheat}</p>
			</div>
			<button
				class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
				on:click={nextTurn}
			>
				Next Turn
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

		{#if game.isGameOver()}
			<div class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
				<h2 class="text-xl font-semibold">Game Over!</h2>
				<p>Winner: {game.getWinner()}</p>
			</div>
		{/if}
	{:else}
		<p>Loading game...</p>
	{/if}
</div>
