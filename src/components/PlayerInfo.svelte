<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { gameSettings } from '$lib/EmojiBattle/gameSettings';

	export let name: string;
	export let health: number;
	export let wheat: number;
	export let wheatGenerated: number = 0;

	let showWheatGenerated = false;
	let showHealthLoss = false;
	let lastHealth = health;
	let healthLoss = 0;

	onMount(() => {
		return () => {
			showWheatGenerated = false;
			showHealthLoss = false;
		};
	});

	$: {
		if (wheatGenerated > 0) {
			showWheatGenerated = true;
			setTimeout(() => {
				showWheatGenerated = false;
			}, gameSettings.DAMAGE_ANIMATION_DURATION);
		}
	}

	$: {
		if (health < lastHealth) {
			healthLoss = lastHealth - health;
			showHealthLoss = true;
			setTimeout(() => {
				showHealthLoss = false;
			}, gameSettings.DAMAGE_ANIMATION_DURATION);
		}
		lastHealth = health;
	}
</script>

<div class="relative">
	<h2 class="text-xl font-semibold">{name}</h2>
	<p>
		🏰❤️: {health}
		{#if showHealthLoss}
			<span
				class="absolute ml-2 text-red-500 font-bold"
				in:fly={{ y: 20, duration: 300 }}
				out:fade={{ duration: 300 }}
			>
				-{healthLoss}
			</span>
		{/if}
	</p>
	<p>
		🌾: {wheat}
		{#if showWheatGenerated}
			<span
				class="absolute ml-2 text-yellow-500 font-bold"
				in:fly={{ y: -20, duration: 300 }}
				out:fade={{ duration: 300 }}
			>
				+{wheatGenerated}
			</span>
		{/if}
	</p>
</div>
