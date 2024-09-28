<script lang="ts">
	import type { Unit } from '$lib/EmojiBattle/types';
	import UnitCardContent from './UnitCardContent.svelte';
	import { fade } from 'svelte/transition';

	export let unit: Unit;
	export let showCost: boolean = false;
	export let onClick: (() => void) | null = null;
	export let isDraggable: boolean = false;
	export let isClickable: boolean = true;
	export let isAttacking: boolean = false;
	export let isOpponent: boolean = false;

	$: attackClass = isAttacking ? (isOpponent ? 'attacking-down' : 'attacking-up') : '';
</script>

<div
	class="unit-card relative w-20 h-[106px] transition-transform duration-300 ease-in-out {attackClass} {unit.hasBattled
		? 'opacity-50'
		: ''}"
>
	{#if isClickable}
		<button
			class="w-full h-full bg-white rounded-lg shadow-md p-2 text-center flex flex-col justify-between {isClickable
				? onClick
					? 'hover:bg-blue-100 cursor-pointer'
					: 'cursor-default'
				: 'cursor-default'}"
			on:click={isClickable ? onClick : null}
			disabled={unit.hasBattled}
		>
			<UnitCardContent {unit} {showCost} {isDraggable} />
		</button>
	{:else}
		<div
			class="w-full h-full bg-white rounded-lg shadow-md p-2 text-center flex flex-col justify-between"
		>
			<UnitCardContent {unit} {showCost} {isDraggable} />
		</div>
	{/if}
	{#if isAttacking}
		<div
			class="absolute inset-0 bg-red-500 opacity-30 rounded-lg"
			in:fade={{ duration: 150 }}
			out:fade={{ duration: 150 }}
		></div>
	{/if}
</div>

<style>
	.attacking-up {
		animation: attack-up 0.3s ease-in-out;
	}

	.attacking-down {
		animation: attack-down 0.3s ease-in-out;
	}

	@keyframes attack-up {
		0% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(0px, -30px) scale(1.1);
		}
		100% {
			transform: translate(0, 0) scale(1);
		}
	}

	@keyframes attack-down {
		0% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(0px, 30px) scale(1.1);
		}
		100% {
			transform: translate(0, 0) scale(1);
		}
	}
</style>
