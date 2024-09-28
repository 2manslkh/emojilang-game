<script lang="ts">
	import UnitCard from '$components/Card/UnitCard.svelte';
	import type { Unit } from '$lib/EmojiBattle/types';

	export let units: Unit[];
	export let onBuyUnit: (unitName: string) => void;
	export let canBuyUnits: boolean;
</script>

<div class=" relative h-[132px]">
	<!-- Increased height to accommodate shadows -->
	<div
		class="flex gap-2 p-3 bg-gray-100 rounded-lg min-w-full max-w-full h-[132px] overflow-x-auto"
	>
		<div class="flex space-x-2 pr-3">
			<!-- Added padding to bottom and right -->
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
	</div>

	{#if !canBuyUnits}
		<div
			class="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-10 rounded-lg"
		>
			<p class="text-white font-bold text-lg">Buying Disabled</p>
		</div>
	{/if}
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
