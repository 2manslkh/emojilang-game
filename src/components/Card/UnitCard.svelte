<script lang="ts">
	import type { Unit } from '$lib/EmojiBattle/types';
	import UnitCardContent from './UnitCardContent.svelte';

	export let unit: Unit;
	export let showCost: boolean = false;
	export let onClick: (() => void) | null = null;
	export let isDraggable: boolean = false;
	export let isClickable: boolean = true;
</script>

{#if isClickable}
	<button
		class="w-20 h-[106px] bg-white rounded-lg shadow-md p-2 text-center flex flex-col justify-between {isClickable
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
		class="w-20 h-[106px] bg-white rounded-lg shadow-md p-2 text-center flex flex-col justify-between"
	>
		<UnitCardContent {unit} {showCost} {isDraggable} />
	</div>
{/if}
