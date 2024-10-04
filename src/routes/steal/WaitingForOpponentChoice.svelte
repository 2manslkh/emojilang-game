<script lang="ts">
	import { fade } from 'svelte/transition';

	export let playerChoice: 'cooperate' | 'betray' | null;
</script>

<div class="bg-gray-100 rounded-lg p-8 shadow-md" in:fade>
	<h2 class="text-2xl font-semibold mb-4">Waiting for opponent's choice</h2>
	<p class="text-xl mb-4 fade-in-out">
		Your choice: {playerChoice === 'cooperate' ? '🤝 Cooperate' : '🔪 Betray'}
	</p>
	<div class="loader"></div>
</div>

<style>
	.fade-in-out {
		animation: fadeInOut 2s ease-in-out infinite;
	}

	@keyframes fadeInOut {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
	.loader {
		border: 5px solid #e5e5e5;
		border-top: 5px solid #333;
		border-radius: 50%;
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	:global(.animate-pulse) {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
