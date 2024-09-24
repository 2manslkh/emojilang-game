<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { inject } from '@vercel/analytics';

	onMount(inject);
</script>

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
