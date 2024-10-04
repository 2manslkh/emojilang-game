<script lang="ts">
	import type { RoundHistory } from '$lib/EmojiSteal/types';

	export let history: RoundHistory[] = [];
</script>

<div class="mt-4">
	<h3 class="text-lg font-semibold mb-2">Opponent's History</h3>
	{#if history.length > 0}
		<ul class="space-y-1">
			{#each history as round}
				<li>
					{round.choice === 'cooperate' ? '🤝' : '🔪'}
					{new Date(round.created_at).toLocaleString()}
				</li>
			{/each}
		</ul>
	{:else}
		<p>No history available</p>
	{/if}
</div>
