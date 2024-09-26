<script lang="ts">
	import { Game, Player } from '$lib/EmojiBattle/client';
	import { onMount } from 'svelte';
	import type { Unit } from '$lib/EmojiBattle/types';
	import { get } from 'svelte/store';

	import PlayerInfo from '$components/PlayerInfo.svelte';
	import UnitGrid from '$components/UnitGrid.svelte';
	import TurnInfo from '$components/TurnInfo.svelte';
	import type { DndEvent } from 'svelte-dnd-action';
	import MockDndGrid from '$components/MockDndGrid.svelte';
	import Shop from '$components/Shop.svelte';

	let game: Game;
	let player: Player;
	let opponent: Player;
	let turn: number;
	let units: Unit[] = [];
	let currentPhase: 'preparation' | 'battle';
	let phaseTimer: number;

	let playerState: { health: number; wheat: number; army: Unit[] };
	let opponentState: { health: number; wheat: number; army: Unit[] };

	onMount(() => {
		player = new Player();
		opponent = new Player();
		game = new Game(player, opponent);
		game.startGame();

		game.currentTurn.subscribe((value) => (turn = value));
		game.currentPhase.subscribe((value) => (currentPhase = value));
		game.phaseTimer.subscribe((value) => (phaseTimer = value));
		units = game.units;

		player.state.subscribe((state) => (playerState = state));
		opponent.state.subscribe((state) => (opponentState = state));
	});

	let playerGridId = 'player-grid';
	let opponentGridId = 'opponent-grid';

	let mockGridId = 'mock-grid';

	function buyUnit(unitName: string) {
		console.log('Buying unit:', unitName);
		player.summonUnit(unitName);
	}

	function nextTurn() {
		game?.nextPhase();
	}

	function handleDndConsider(e: CustomEvent<DndEvent<Unit>>) {
		playerState.army = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Unit>>) {
		playerState.army = e.detail.items;
		player.rearrangeArmy(playerState.army);
	}

	function handleMockDndConsider(e: CustomEvent<DndEvent<{ id: number; name: string }>>) {
		console.log('Mock DnD Consider:', e.detail.items);
	}

	function handleMockDndFinalize(e: CustomEvent<DndEvent<{ id: number; name: string }>>) {
		console.log('Mock DnD Finalize:', e.detail.items);
	}

	$: gameOver = get(game?.gameOver) ?? false;
</script>

<div class="container mx-auto p-4 max-w-3xl">
	{#if game && playerState && opponentState}
		<div class="flex justify-between items-center mb-4">
			<PlayerInfo name="Enemy" health={opponentState.health} wheat={opponentState.wheat} />
			<TurnInfo {turn} {currentPhase} {phaseTimer} phaseDuration={game.PHASE_DURATION} />
		</div>

		<h2 class="text-lg font-semibold mb-2">Enemy Army</h2>
		<UnitGrid army={opponentState.army} gridId={opponentGridId} />

		<h2 class="text-lg font-semibold mt-6 mb-2">Your Army</h2>
		<UnitGrid
			army={playerState.army}
			isDraggable={true}
			gridId={playerGridId}
			on:consider={handleDndConsider}
			on:finalize={handleDndFinalize}
		/>

		<div class="flex justify-between items-center my-4">
			<PlayerInfo name="Player" health={playerState.health} wheat={playerState.wheat} />
		</div>

		<h2 class="text-lg font-semibold mt-6 mb-2">Shop</h2>
		<Shop {units} onBuyUnit={buyUnit} />

		<h2 class="text-xl font-semibold mt-8 mb-4">Mock Drag and Drop Grid</h2>
		<MockDndGrid
			gridId={mockGridId}
			on:consider={handleMockDndConsider}
			on:finalize={handleMockDndFinalize}
		/>

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
