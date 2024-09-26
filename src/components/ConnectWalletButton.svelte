<script lang="ts">
	export let onClick: () => void;
</script>

<div class="relative inline-block overflow-hidden px-1 py-1 rounded-full">
	<div class="absolute inset-0 rounded-full">
		<div class="conic-gradient-circle"></div>
	</div>
	<button
		on:click={onClick}
		class="relative flex items-center justify-center px-6 py-3 bg-black text-white rounded-full border border-gray-600 hover:bg-gray-800 transition-colors duration-200 z-10"
	>
		<svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="2" />
			<path d="M3 10H21" stroke="currentColor" stroke-width="2" />
		</svg>
		<span class="text-lg font-semibold">Connect Wallet</span>
	</button>
</div>

<style>
	.conic-gradient-circle {
		position: absolute;
		width: 300px;
		height: 300px;
		border-radius: 50%;
		background: conic-gradient(
			from 0deg,
			red 0deg,
			orange 60deg,
			yellow 120deg,
			green 180deg,
			blue 240deg,
			indigo 300deg,
			violet 360deg
		);
		top: 50%;
		left: 50%;
		animation: rotate 1s linear infinite;
	}

	@keyframes rotate {
		from {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
</style>
