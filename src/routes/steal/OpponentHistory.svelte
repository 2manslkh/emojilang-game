<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	import type { Player } from '$lib/EmojiSteal/types';

	export let player: Player | undefined;
</script>

{#if player}
	<div class="mb-8 bg-gray-100 rounded-lg p-4 shadow-md" in:fade={{ delay: 200 }}>
		<h3 class="text-xl font-semibold mb-2">{player.name || 'Opponent'}</h3>
		<div class="flex space-x-2">
			{#if player.roundHistory}
				{#each [...player.roundHistory].reverse() as choice}
					<span class="text-3xl" in:fly={{ y: 20, duration: 300 }}
						>{choice.choice === 'cooperate' ? '🤝' : '🔪'}</span
					>
				{/each}
			{:else}
				<p>No history available</p>
			{/if}
		</div>
	</div>
{/if}
