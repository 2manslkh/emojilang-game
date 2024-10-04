<script lang="ts">
	import { fade } from 'svelte/transition';

	export let playerName: string;
	export let handleJoin: () => void;
	export let joinError: string;
</script>

<div class="bg-gray-100 rounded-lg p-8 shadow-md" in:fade={{ duration: 1000, delay: 600 }}>
	<h2 class="text-2xl font-semibold mb-4">Join the Game</h2>
	<input
		type="text"
		bind:value={playerName}
		placeholder="Enter your name"
		class="w-full mb-4 p-3 border rounded bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
	/>
	<button
		on:click={handleJoin}
		class="w-full bg-black text-white px-4 py-3 rounded font-semibold hover:bg-gray-800 transition duration-300"
	>
		Join Game
	</button>
	{#if joinError}
		<p class="text-red-500 mt-2">{joinError}</p>
	{/if}
</div>
