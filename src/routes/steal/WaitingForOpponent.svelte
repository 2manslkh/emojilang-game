<script lang="ts">
	import { fade } from 'svelte/transition';
</script>

<div class="text-center" in:fade>
	<p class="text-2xl mb-4">Waiting for an opponent...</p>
	<div class="loader"></div>
</div>

<style>
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
