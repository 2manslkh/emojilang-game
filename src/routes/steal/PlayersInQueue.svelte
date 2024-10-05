<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	export let onlinePlayerCount: number;
</script>

<h1 class="text-4xl font-bold mb-8 text-center" in:fly={{ y: -50, duration: 1000, delay: 200 }}>
	EmojiSteal Game
</h1>
<p class="mb-8 text-xl text-center" in:fade={{ duration: 1000, delay: 400 }}>
	{onlinePlayerCount}
	{onlinePlayerCount === 1 ? 'player' : 'players'} online
</p>
