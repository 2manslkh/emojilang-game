<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { inject } from '@vercel/analytics';

	onMount(inject);
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
	/>
	<script>
		document.addEventListener(
			'touchstart',
			function (event) {
				if (event.touches.length > 1) {
					event.preventDefault();
				}
			},
			{ passive: false }
		);

		document.addEventListener(
			'touchend',
			function (event) {
				// Allow all clicks on buttons, inputs, and elements within UnitCard
				if (
					event.target.tagName === 'BUTTON' ||
					event.target.tagName === 'INPUT' ||
					event.target.closest('.unit-card')
				) {
					return;
				}
				event.preventDefault();
			},
			{ passive: false }
		);
	</script>
</svelte:head>

<div class="app">
	<main>
		<slot />
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
