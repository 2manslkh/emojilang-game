<script lang="ts">
	import EmojiGame from '../components/Game/EmojiGame.svelte';
	import Rules from '../components/Rules/Rules.svelte';
</script>

<svelte:head>
	<title>Emoji Translation Game</title>
	<meta name="description" content="Play the Emoji Translation Game" />
</svelte:head>

<main class="container mx-auto px-4 py-10">
	<div class="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
		<EmojiGame />
	</div>

	<div class="mt-8">
		<Rules />
	</div>
</main>
