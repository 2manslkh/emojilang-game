<script lang="ts">
	import type { Unit } from '$lib/EmojiBattle/types';

	export let unit: Unit;
	export let showCost: boolean = false;
	export let isDraggable: boolean = false;
</script>

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
