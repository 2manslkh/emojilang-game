<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { GameSession } from '$lib/EmojiSteal/types';

	export let gameSession: GameSession | null;
	export let playerChoice: 'cooperate' | 'betray' | 'no_choice';
	export let opponentChoice: 'cooperate' | 'betray' | 'no_choice';

	function getChoiceDisplay(choice: 'cooperate' | 'betray' | 'no_choice') {
		if (choice === 'cooperate') return '🤝';
		if (choice === 'betray') return '🔪';
		return '❓'; // For null choices
	}

	function getResultMessage(
		playerChoice: 'cooperate' | 'betray' | 'no_choice',
		opponentChoice: 'cooperate' | 'betray' | 'no_choice'
	) {
		if (playerChoice === 'no_choice' && opponentChoice === 'no_choice') {
			return 'Both players disconnected. No points awarded.';
		} else if (playerChoice === 'no_choice') {
			return 'You disconnected. Your opponent gains 1 point.';
		} else if (opponentChoice === 'no_choice') {
			return 'Your opponent disconnected. You gain 1 point.';
		} else if (playerChoice === 'cooperate' && opponentChoice === 'cooperate') {
			return 'Both cooperated! You each gain 2 points.';
		} else if (playerChoice === 'betray' && opponentChoice === 'cooperate') {
			return 'You betrayed! You gain 3 points, opponent gains 0.';
		} else if (playerChoice === 'cooperate' && opponentChoice === 'betray') {
			return 'You were betrayed! You gain 0 points, opponent gains 3.';
		} else if (playerChoice === 'betray' && opponentChoice === 'betray') {
			return 'Both betrayed! You each lose 1 point.';
		}
		return 'Unexpected result.';
	}

	$: resultMessage = getResultMessage(playerChoice, opponentChoice);
</script>

{#if gameSession}
	<div class="bg-gray-100 rounded-lg p-8 shadow-md" in:fade>
		<h2 class="text-2xl font-semibold mb-4">Round Result</h2>
		{#if gameSession}
			<p class="text-sm text-gray-500 mb-4">Game ID: {gameSession.id}</p>
		{/if}
		<div class="flex justify-center items-center space-x-8 mb-6">
			<div class="text-center">
				<p class="text-lg mb-2">You chose:</p>
				<p class="text-5xl">{getChoiceDisplay(playerChoice)}</p>
			</div>
			<div class="text-center">
				<p class="text-lg mb-2">Opponent chose:</p>
				<p class="text-5xl">{getChoiceDisplay(opponentChoice)}</p>
			</div>
		</div>
		<p class="text-xl font-bold mb-6 text-center">{resultMessage}</p>
		<p class="text-lg text-center">Next round starting soon...</p>
	</div>
{:else}
	<div class="flex justify-center items-center h-64">
		<div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
	</div>
{/if}
