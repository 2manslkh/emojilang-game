<script lang="ts">
	import UnitCard from '$components/Card/UnitCard.svelte';
	import type { Unit } from '$lib/EmojiBattle/types';
	import { dndzone } from 'svelte-dnd-action';
	import { createEventDispatcher } from 'svelte';
	import { flip } from 'svelte/animate';
	import { attackingUnits } from '$lib/EmojiBattle/client';

	export let army: Unit[];
	export let isDraggable = false;
	export let gridId: string;

	const dispatch = createEventDispatcher();

	function handleDndConsider(e: CustomEvent<DndEvent<Unit>>) {
		dispatch('consider', e.detail);
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Unit>>) {
		dispatch('finalize', e.detail);
	}

	$: attackingUnitIds = $attackingUnits.filter((u) => u !== null).map((u) => u!.id);
</script>

<div
	class="grid grid-cols-6 gap-2 mb-4 h-48 overflow-y-auto bg-gray-100 rounded-lg p-3 border border-gray-300 shadow-inner"
	use:dndzone={{ items: army, flipDurationMs: 300, dropTargetStyle: {}, type: gridId }}
	on:consider={handleDndConsider}
	on:finalize={handleDndFinalize}
>
	{#each army as unit (unit.id)}
		<div animate:flip={{ duration: 300 }} class="flex items-center justify-center">
			<UnitCard
				{unit}
				{isDraggable}
				isClickable={false}
				isAttacking={attackingUnitIds.includes(unit.id)}
			/>
		</div>
	{/each}
</div>
