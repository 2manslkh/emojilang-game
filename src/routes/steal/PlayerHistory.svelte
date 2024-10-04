<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	export let history: any[];
</script>

<div class="mt-8 bg-gray-100 rounded-lg p-4 shadow-md" in:fade={{ delay: 200 }}>
	<h3 class="text-xl font-semibold mb-2">Your History</h3>
	<div class="flex space-x-2">
		{#each [...history].reverse() as choice}
			<span class="text-3xl" in:fly={{ y: 20, duration: 300 }}
				>{choice.choice === 'cooperate' ? '🤝' : '🔪'}</span
			>
		{/each}
	</div>
</div>
