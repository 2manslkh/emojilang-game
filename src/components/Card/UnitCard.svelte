<script lang="ts">
	import type { Unit } from '$lib/EmojiBattle/types';
	import UnitCardContent from './UnitCardContent.svelte';
	import { spring } from 'svelte/motion';
	import { fade } from 'svelte/transition';

	export let unit: Unit;
	export let showCost: boolean = false;
	export let onClick: (() => void) | null = null;
	export let isDraggable: boolean = false;
	export let isClickable: boolean = true;
	export let isAttacking: boolean = false;

	const position = spring(
		{ x: 0, y: 0 },
		{
			stiffness: 0.1,
			damping: 0.25
		}
	);

	$: if (isAttacking) {
		position.set({ x: 10, y: -10 });
		setTimeout(() => position.set({ x: 0, y: 0 }), 300);
	}
</script>

<div
	class="relative w-20 h-[106px] transition-transform duration-300 ease-in-out {isAttacking
		? 'scale-110'
		: ''}"
	style="transform: translate({$position.x}px, {$position.y}px);"
>
	{#if isClickable}
		<button
			class="w-full h-full bg-white rounded-lg shadow-md p-2 text-center flex flex-col justify-between {isClickable
				? onClick
					? 'hover:bg-blue-100 cursor-pointer'
					: 'cursor-default'
				: 'cursor-default'}"
			on:click={isClickable ? onClick : null}
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
