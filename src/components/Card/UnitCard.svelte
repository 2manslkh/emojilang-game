<script lang="ts">
	import type { Unit } from '$lib/EmojiBattle/types';

	export let unit: Unit;
	export let showCost: boolean = false;
	export let onClick: (() => void) | null = null;
	export let isDraggable: boolean = false;
</script>

<div
	class="w-20 h-[106px] bg-white rounded-lg shadow-md p-2 text-center flex flex-col justify-between {onClick
		? 'hover:bg-blue-100 cursor-pointer'
		: ''} {isDraggable ? 'cursor-move' : ''}"
	on:click={onClick}
>
	<div class="flex w-full justify-between items-start">
		<div class="text-4xl">{unit.emoji}</div>
		{#if showCost}
			<div class="text-sm font-bold text-yellow-500 flex items-center">
				<span class="">🌾</span>{unit.cost}
			</div>
		{/if}
		{#if isDraggable}
			<div class="text-xs text-gray-400">⇅</div>
		{/if}
	</div>
	<div class="flex w-full justify-between text-sm mt-auto">
		<span class="flex items-center">
			<span class="text-red-500">❤️</span>{unit.health}
		</span>
		<span class="flex items-center">
			<span class="text-gray-500">⚔️</span>{unit.attack}
		</span>
	</div>
</div>
