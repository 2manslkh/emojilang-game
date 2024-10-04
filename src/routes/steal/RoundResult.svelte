<script lang="ts">
	import { fade } from 'svelte/transition';

	export let gameSession;
	export let playerChoice;
	export let opponentChoice;
	export let roundResult;
</script>

<div class="bg-gray-100 rounded-lg p-8 shadow-md" in:fade>
	<h2 class="text-2xl font-semibold mb-4">Round Result</h2>
	{#if gameSession}
		<p class="text-sm text-gray-500 mb-4">Game ID: {gameSession.id}</p>
	{/if}
	<div class="flex justify-center items-center space-x-8 mb-6">
		<div class="text-center">
			<p class="text-lg mb-2">You chose:</p>
			<p class="text-5xl">
				{#if playerChoice === 'cooperate'}
					🤝
				{:else if playerChoice === 'betray'}
					🔪
				{:else}
					❓
				{/if}
			</p>
		</div>
		<div class="text-center">
			<p class="text-lg mb-2">Opponent chose:</p>
			<p class="text-5xl">
				{#if opponentChoice === 'cooperate'}
					🤝
				{:else if opponentChoice === 'betray'}
					🔪
				{:else}
					❓
				{/if}
			</p>
		</div>
	</div>
	<p class="text-xl font-bold mb-6 text-center">{roundResult}</p>
	<p class="text-lg text-center">Next round starting soon...</p>
</div>
