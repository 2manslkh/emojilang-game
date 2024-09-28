<script lang="ts">
	import { Game, Player, attackingUnits } from '$lib/EmojiBattle/client';
	import { onMount } from 'svelte';
	import type { Unit } from '$lib/EmojiBattle/types';
	import { get } from 'svelte/store';
	import PlayerInfo from '$components/PlayerInfo.svelte';
	import UnitGrid from '$components/UnitGrid.svelte';
	import type { DndEvent } from 'svelte-dnd-action';
	import Shop from '$components/Shop.svelte';
	import TurnInfo from '$components/TurnInfo.svelte';
	import { gameSettings } from '$lib/EmojiBattle/gameSettings';

	let game: Game;
	let player: Player;
	let opponent: Player;
	let turn: number;
	let units: Unit[] = [];
	let currentPhase: 'preparation' | 'battle';
	let phaseTimer: number;

	let playerState: { health: number; wheat: number; army: Unit[] };
	let opponentState: { health: number; wheat: number; army: Unit[] };

	// Add this reactive variable
	$: canBuyUnits = currentPhase === 'preparation';

	onMount(() => {
		player = new Player('Player');
		opponent = new Player('Opponent', true); // AI player
		game = new Game(player, opponent);
		game.startGame();

		game.currentTurn.subscribe((value) => (turn = value));
		game.currentPhase.subscribe((value) => (currentPhase = value));
		game.phaseTimer.subscribe((value) => (phaseTimer = value));
		units = game.units;

		player.state.subscribe((state) => (playerState = state));
		opponent.state.subscribe((state) => (opponentState = state));
	});

	let currentAttackingUnits: [Unit | null, Unit | null];
	attackingUnits.subscribe((value) => (currentAttackingUnits = value));

	function buyUnit(unitName: string) {
		console.log('Buying unit:', unitName);
		player.summonUnit(unitName, game);
	}

	function handleDndConsider(e: CustomEvent<DndEvent<Unit>>) {
		playerState.army = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Unit>>) {
		playerState.army = e.detail.items;
		player.rearrangeArmy(playerState.army);
	}

	$: gameOver = get(game?.gameOver) ?? false;

	// New variables to track wheat generated
	let playerWheatGenerated = 0;
	let opponentWheatGenerated = 0;

	$: {
		if (currentPhase === 'preparation') {
			playerWheatGenerated = player.getLastWheatGenerated();
			opponentWheatGenerated = opponent.getLastWheatGenerated();
		} else {
			playerWheatGenerated = 0;
			opponentWheatGenerated = 0;
		}
	}
</script>

<svelte:head>
	<title>Emoji Battle</title>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
	/>
	<meta name="description" content="Play Emoji Battle: Build your army, crush your opponent!" />
	<meta name="keywords" content="emoji, battle, strategy, game, kingdom, army" />
	<meta name="author" content="Emoji Battle Team" />
	<meta property="og:title" content="Emoji Battle Kingdom" />
	<meta
		property="og:description"
		content="Build your emoji army and crush your opponent in this exciting strategy game!"
	/>
	<meta property="og:image" content="https://emojibattle.com/battle-og.png" />
	<meta property="og:url" content="https://emojibattle.com" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="container mx-auto p-4 max-w-3xl">
	{#if game && playerState && opponentState}
		<div class="flex justify-between items-center mb-4">
			<PlayerInfo name="Enemy" health={opponentState.health} wheat={opponentState.wheat} />
		</div>

		<UnitGrid army={opponentState.army} gridId={'opponent-grid'} isOpponent={true} />

		<TurnInfo {turn} {currentPhase} {phaseTimer} />

		<UnitGrid
			army={playerState.army}
			isDraggable={true}
			gridId={'player-grid'}
			on:consider={handleDndConsider}
			on:finalize={handleDndFinalize}
		/>

		<div class="flex justify-between items-center my-4">
			<PlayerInfo
				name="Player"
				health={playerState.health}
				wheat={playerState.wheat}
				wheatGenerated={playerWheatGenerated}
			/>
		</div>

		<Shop {units} onBuyUnit={buyUnit} {canBuyUnits} />

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
