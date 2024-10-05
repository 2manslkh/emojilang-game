<script lang="ts">
	import type { Player } from '$lib/EmojiSteal/types';

	export let player: Player | null;
</script>

{#if player}
	<div class="bg-white shadow-md rounded-lg p-4 mt-4">
		<div class="flex justify-between">
			<h2 class="text-xl font-bold mb-2">{player.name}</h2>
			<p class="text-lg mb-2">{player.points || 0} 🏆</p>
		</div>
		<h3 class="text-lg font-semibold mb-2">Round History:</h3>
		<div class="flex flex-wrap gap-1">
			{#each player.roundHistory as round}
				<span
					class="inline-block px-2 py-1 rounded-full text-sm {round.choice === 'cooperate'
						? 'bg-green-200 text-green-800'
						: 'bg-red-200 text-red-800'}"
				>
					{round.choice === 'cooperate' ? '🤝' : '🔪'}
				</span>
			{/each}
		</div>
	</div>
{/if}
