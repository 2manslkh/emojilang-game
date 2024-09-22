<script lang="ts">
	import { onMount } from 'svelte';

	let currentSentence: string = '';
	let userTranslation: string = '';
	let score: number = 0;
	let feedback: string = '';
	let gameActive: boolean = true;
	let submitDisabled: boolean = false;

	const emojiSentences: string[] = [
		'👤 ❤️ 👉',
		'🔝 🐕 🍽️ 🔽 🦴',
		'👥 ⏩ 🚶 ➡️ 🏖️ 🔜',
		'👉 ❤️ 🍕 ❓',
		'👩 ❌ 🥤 ☕',
		'👨 ⏪ 👀 🎬',
		'🔢 🐦 🚶 ⬆️ 🌳',
		'👥👥 ➕ 👤 🍽️ 🍕',
		'🔵 🟰 🔝 🔵',
		'👩 🗣️ ➡️ 👨 ➕ 👨 👂',
		'🌞 ⏩ 🌧️ 🔜',
		'👤 ⏪ 🚶 🏫 ⏪',
		'🐈 ➕ 🐕 🟰 🐾',
		'👥 ❓ 🍽️ 🍔 🔜',
		'🌍 ⏩ 🔥 ⬆️'
	];

	const correctTranslations: string[] = [
		'I love you',
		'The big dog eats a small bone',
		'We will go to the beach tomorrow',
		'Do you like pizza?',
		"She doesn't drink coffee",
		'He watched a movie',
		'Many birds walk on the tree',
		'They and I eat pizza',
		'It is a big thing',
		'She speaks to him and he listens',
		'The sun will rain soon',
		'I went to school yesterday',
		'Cats and dogs are pets',
		'Shall we eat burgers later?',
		'The world will get hotter'
	];

	function getRandomSentence(): string {
		const index = Math.floor(Math.random() * emojiSentences.length);
		return emojiSentences[index];
	}

	function startGame() {
		gameActive = true;
		score = 0;
		nextSentence();
	}

	function nextSentence() {
		currentSentence = getRandomSentence();
		userTranslation = '';
		feedback = '';
		submitDisabled = false;
	}

	function submitTranslation() {
		submitDisabled = true;
		const index = emojiSentences.indexOf(currentSentence);
		const correctTranslation = correctTranslations[index];

		// Simple scoring function (replace with AI agent in real implementation)
		const similarity = stringSimilarity(
			userTranslation.toLowerCase(),
			correctTranslation.toLowerCase()
		);
		const newPoints = Math.round(similarity * 10);

		score += newPoints;
		feedback = `You earned ${newPoints} points. Correct translation: "${correctTranslation}"`;

		setTimeout(nextSentence, 3000);
	}

	// Simple string similarity function (replace with more sophisticated method or AI agent)
	function stringSimilarity(str1: string, str2: string): number {
		const len1 = str1.length;
		const len2 = str2.length;
		const maxLen = Math.max(len1, len2);
		let matches = 0;

		for (let i = 0; i < maxLen; i++) {
			if (str1[i] === str2[i]) matches++;
		}

		return matches / maxLen;
	}

	onMount(() => {
		startGame();
	});
</script>

<div class="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
	<div class="p-6">
		<h2 class="text-2xl font-bold text-center mb-4">Emoji Translation Game</h2>

		<div class="text-4xl text-center mb-4">{currentSentence}</div>

		<input
			type="text"
			bind:value={userTranslation}
			placeholder="Enter your translation"
			class="w-full p-2 border rounded-md mb-4"
			disabled={submitDisabled}
		/>

		<button
			on:click={submitTranslation}
			class="w-full bg-black text-white py-2 rounded-md mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={submitDisabled}
		>
			Submit Translation
		</button>

		<div class="mb-4">
			<p class="font-semibold mb-1">Total Score: {score}</p>
			<div class="w-full bg-gray-200 rounded-full h-2.5">
				<div class="bg-blue-600 h-2.5 rounded-full" style="width: {(score / 150) * 100}%"></div>
			</div>
		</div>

		{#if feedback}
			<p class="mt-4 text-sm text-gray-600">{feedback}</p>
		{/if}
	</div>
</div>
