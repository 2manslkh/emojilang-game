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
	export let isOpponent = false; // New prop to identify if this is the opponent's grid

	const dispatch = createEventDispatcher();

	function handleDndConsider(e: CustomEvent<DndEvent<Unit>>) {
		if (!isOpponent) {
			dispatch('consider', e.detail);
		}
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Unit>>) {
		if (!isOpponent) {
			dispatch('finalize', e.detail);
		}
	}

	$: attackingUnitIds = $attackingUnits.filter((u) => u !== null).map((u) => u!.id);
</script>

<div class="overflow-x-auto">
	<div
		class="flex gap-2 p-3 bg-gray-100 rounded-lg border border-gray-300 shadow-inner min-w-full h-[132px]"
		style="width: max-content;"
		use:dndzone={{
			items: army,
			flipDurationMs: 300,
			dropTargetStyle: {},
			type: gridId,
			dragDisabled: isOpponent || !isDraggable
		}}
		on:consider={handleDndConsider}
		on:finalize={handleDndFinalize}
	>
		{#each army as unit (unit.id)}
			<div animate:flip={{ duration: 300 }}>
				<UnitCard
					{unit}
					isDraggable={isDraggable && !isOpponent}
					isClickable={false}
					isAttacking={attackingUnitIds.includes(unit.id)}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.overflow-x-auto::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.overflow-x-auto {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
