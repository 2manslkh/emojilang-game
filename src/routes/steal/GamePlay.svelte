<script lang="ts">
	import { fade } from 'svelte/transition';
	import { TimerBar } from '$components/Timer';

	export let opponent;
	export let gameSession;
	export let timeLeft;
	export let totalTime;
	export let playerChoice;
	export let handleChoice;
</script>

<div class="bg-gray-100 rounded-lg p-8 shadow-md" in:fade>
	<h2 class="text-2xl font-semibold mb-4">Playing against {opponent?.name}</h2>
	{#if gameSession}
		<p class="text-sm text-gray-500 mb-4">Game ID: {gameSession.id}</p>
	{/if}
	<TimerBar timeRemaining={timeLeft} {totalTime} class="mb-6" />
	{#if playerChoice === null}
		<div class="flex justify-center space-x-4">
			<button
				on:click={() => handleChoice('cooperate')}
				class="w-1/2 bg-green-500 hover:bg-green-600 text-white px-4 py-4 rounded-lg text-xl font-semibold transition duration-300 transform hover:scale-105 flex items-center justify-center"
			>
				<span class="mr-2">🤝</span> Cooperate
			</button>
			<button
				on:click={() => handleChoice('betray')}
				class="w-1/2 bg-red-500 hover:bg-red-600 text-white px-4 py-4 rounded-lg text-xl font-semibold transition duration-300 transform hover:scale-105 flex items-center justify-center"
			>
				<span class="mr-2">🔪</span> Betray
			</button>
		</div>
	{:else}
		<p class="text-3xl mb-4 animate-pulse">
			Your choice: {playerChoice === 'cooperate' ? '🤝 Cooperate' : '🔪 Betray'}
		</p>
		<p class="text-xl mb-4">Waiting for opponent's choice...</p>
	{/if}
</div>
