<script lang="ts">
	import UnitCard from '$components/Card/UnitCard.svelte';
	import type { Unit } from '$lib/EmojiBattle/types';

	export let units: Unit[];
	export let onBuyUnit: (unitName: string) => void;
</script>

<div class="bg-gray-100 p-4 rounded-lg">
	<h2 class="text-xl font-semibold mb-2">Shop</h2>
	<div class="grid grid-cols-3 gap-2">
		{#each units as unit}
			<UnitCard {unit} showCost={true} onClick={() => onBuyUnit(unit.name)} />
		{/each}
	</div>
</div>
