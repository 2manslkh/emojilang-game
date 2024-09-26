<script lang="ts">
	import EmojiGameRush from '$components/Game/EmojiGameRush.svelte';
	import CryptoRules from '$components/Rules/CryptoRules.svelte';
	import { Socials } from '$components/Socials';

	let showRules: boolean = true;
	let gameStarted: boolean = false;

	function startGame() {
		showRules = false;
		gameStarted = true;
	}
</script>

<svelte:head>
	<title>EmojiRush: Crypto Edition</title>
	<meta name="description" content="Play EmojiRush: Crypto Edition" />
	<meta name="keywords" content="emoji, crypto, game, blockchain, cryptocurrency" />
	<meta name="author" content="Your Name or Company" />
	<meta property="og:title" content="EmojiRush: Crypto Edition" />
	<meta
		property="og:description"
		content="Test your crypto knowledge in this fast-paced emoji translation game!"
	/>
	<meta property="og:image" content="https://emojigame.xyz/og.png" />
	<meta property="og:url" content="https://emojigame.xyz/rush" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<main class="container mx-auto px-4 py-10 flex flex-col min-h-screen items-center">
	{#if showRules}
		<div class="flex flex-col w-full max-w-2xl mt-16">
			<CryptoRules />
			<button on:click={startGame} class="mt-6 bg-black text-white py-2 rounded-md mb-4">
				Start Game
			</button>
		</div>
	{:else if gameStarted}
		<EmojiGameRush {gameStarted} />
	{/if}
	<div class="flex flex-col w-full max-w-2xl mt-8">
		<Socials />
	</div>
</main>
