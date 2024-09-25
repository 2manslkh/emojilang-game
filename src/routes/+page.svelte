<script lang="ts">
	import EmojiGame from '$components/Game/EmojiGame.svelte';
	import Rules from '$components/Rules/Rules.svelte';
	import { Socials } from '$components/Socials';

	let showRules = false;

	function toggleRules() {
		showRules = !showRules;
	}
</script>

<svelte:head>
	<title>Emoji Translation Game</title>
	<meta name="description" content="Play the Emoji Translation Game" />
	<meta name="keywords" content="emoji, translation, game, language learning, emojilang" />
	<meta name="author" content="Your Name or Company" />
	<meta property="og:title" content="Emoji Translation Game" />
	<meta
		property="og:description"
		content="Learn to communicate with emojis in this fun translation game!"
	/>
	<meta property="og:image" content="https://emojigame.xyz/og.png" />
	<meta property="og:url" content="https://emojigame.xyz" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<main class="container mx-auto px-4 py-10 flex flex-col min-h-screen items-center">
	<div class="flex flex-col w-full max-w-md mt-20">
		<div
			class="w-full bg-white rounded-lg shadow-md overflow-hidden mb-4 self-center place-self-center"
		>
			<EmojiGame />
		</div>
	</div>
	<div class="flex flex-col w-full max-w-md">
		<div class="w-full mb-4">
			<Socials />
		</div>

		<div class="w-full max-w-md">
			<button
				on:click={toggleRules}
				class="w-full bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition-colors"
			>
				{showRules ? 'Hide Rules' : 'Show Rules'}
			</button>

			{#if showRules}
				<div
					class="max-w-md bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out mt-4"
				>
					<Rules />
				</div>
			{/if}
		</div>
	</div>
</main>
