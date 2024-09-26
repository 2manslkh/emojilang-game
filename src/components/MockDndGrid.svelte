<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { createEventDispatcher } from 'svelte';

	type Item = {
		id: number;
		name: string;
	};

	let items: Item[] = [
		{ id: 1, name: 'Item 1' },
		{ id: 2, name: 'Item 2' },
		{ id: 3, name: 'Item 3' },
		{ id: 4, name: 'Item 4' },
		{ id: 5, name: 'Item 5' },
		{ id: 6, name: 'Item 6' }
	];

	export let gridId = 'mock-grid';

	const dispatch = createEventDispatcher();

	function handleDndConsider(e: CustomEvent<DndEvent<Item>>) {
		items = e.detail.items;
		dispatch('consider', e.detail);
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Item>>) {
		items = e.detail.items;
		dispatch('finalize', e.detail);
	}
</script>

<div
	class="grid grid-cols-3 gap-4 p-4 bg-gray-100 rounded-lg h-48 overflow-y-auto"
	use:dndzone={{ items, flipDurationMs: 300, type: gridId }}
	on:consider={handleDndConsider}
	on:finalize={handleDndFinalize}
>
	{#each items as item (item.id)}
		<div animate:flip={{ duration: 300 }} class="bg-white p-4 rounded shadow cursor-move">
			{item.name}
		</div>
	{/each}
</div>
