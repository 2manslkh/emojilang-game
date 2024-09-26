<script lang="ts">
	import UnitCard from '$components/Card/UnitCard.svelte';
	import type { Unit } from '$lib/EmojiBattle/types';

	export let units: Unit[];
	export let onBuyUnit: (unitName: string) => void;
	export let canBuyUnits: boolean;
</script>

<div class="bg-gray-100 p-4 rounded-lg relative">
	<h2 class="text-xl font-semibold mb-2">Shop</h2>
	{#if !canBuyUnits}
		<p class="text-red-500 mb-2">Cannot buy units during battle phase</p>
	{/if}
	<div class="overflow-x-auto relative">
		<div class="flex space-x-2 pb-2">
			{#each units as unit}
				<div class="flex-shrink-0">
					<UnitCard
						{unit}
						showCost={true}
						onClick={canBuyUnits ? () => onBuyUnit(unit.name) : null}
						isClickable={canBuyUnits}
					/>
				</div>
			{/each}
		</div>
		{#if !canBuyUnits}
			<div class="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
				<p class="text-white font-bold text-lg">Buying Disabled</p>
			</div>
		{/if}
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
