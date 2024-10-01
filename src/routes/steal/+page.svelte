<script lang="ts">
	import { onMount } from 'svelte';
	import { players, currentPlayer, joinGame, stealEmoji } from '$lib/EmojiSteal/client';

	let playerName = '';
	let hasJoined = false;

	onMount(() => {
		// Reset game state when component mounts
		hasJoined = false;
		playerName = '';
	});

	function handleJoin() {
		if (playerName.trim()) {
			joinGame(playerName.trim());
			hasJoined = true;
		}
	}

	function handleSteal(targetId: string) {
		stealEmoji(targetId);
	}

	$: playerCount = $players.length;
</script>

<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold mb-4">Emoji Steal Game</h1>
	<p class="mb-4 text-gray-600">
		{playerCount}
		{playerCount === 1 ? 'player' : 'players'} connected
	</p>

	{#if !hasJoined}
		<div class="flex flex-col items-center justify-center">
			<input
				type="text"
				bind:value={playerName}
				placeholder="Enter your name"
				class="mb-4 p-2 border rounded"
			/>
			<button on:click={handleJoin} class="bg-blue-500 text-white px-4 py-2 rounded">
				Join Game
			</button>
		</div>
	{:else if $players.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each $players as player}
				<div class="bg-gray-100 p-4 rounded shadow">
					<p class="text-xl">{player.emoji}</p>
					<p>{player.name}</p>
					{#if player.id !== $currentPlayer?.id}
						<button
							on:click={() => handleSteal(player.id)}
							class="mt-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
						>
							Steal
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p>Waiting for players to join...</p>
	{/if}
</div>
