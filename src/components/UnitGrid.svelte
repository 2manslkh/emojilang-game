<script lang="ts">
	import UnitCard from '$components/Card/UnitCard.svelte';
	import type { Unit } from '$lib/EmojiBattle/types';
	import { dndzone } from 'svelte-dnd-action';
	import { createEventDispatcher } from 'svelte';
	import { flip } from 'svelte/animate';

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
</script>

<div
	class="w-full grid grid-cols-6 gap-2 mb-4 h-48 overflow-y-auto pr-2 border border-gray-200 rounded-lg p-2"
	use:dndzone={{ items: army, flipDurationMs: 300, dropTargetStyle: {}, type: gridId }}
	on:consider={handleDndConsider}
	on:finalize={handleDndFinalize}
>
	{#each army as unit (unit.id)}
		<div animate:flip={{ duration: 300 }}>
			<UnitCard {unit} {isDraggable} />
		</div>
	{/each}
</div>
