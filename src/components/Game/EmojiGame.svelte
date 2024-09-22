<script lang="ts">
	import { onMount } from 'svelte';

	let currentQuestion: { emojilang: string; level: number } | null = null;
	let userTranslation: string = '';
	let score: number = 0;
	let feedback: string = '';
	let gameActive: boolean = true;
	let submitDisabled: boolean = false;
	let currentLevel: number = 1;
	let levels: { number: number; name: string; description: string }[] = [];
	let questions: any[] = [];
	let correctAnswersInLevel: number = 0;

	async function fetchLevels() {
		const response = await fetch('/api/levels');
		levels = await response.json();
	}

	function getCurrentLevelName(): string {
		const currentLevelObj = levels.find((level) => level.number === currentLevel);
		return currentLevelObj ? currentLevelObj.name : '';
	}

	async function fetchQuestions(level: number) {
		const response = await fetch(`/api/levels/${level}/questions`);
		questions = await response.json();
	}

	function getRandomQuestion(): { emojilang: string; level: number } {
		const index = Math.floor(Math.random() * questions.length);
		return questions[index];
	}

	async function startGame() {
		gameActive = true;
		score = 0;
		currentLevel = 1;
		correctAnswersInLevel = 0;
		await fetchQuestions(currentLevel);
		nextQuestion();
	}

	function nextQuestion() {
		currentQuestion = getRandomQuestion();
		userTranslation = '';
		feedback = '';
		submitDisabled = false;
	}

	async function submitTranslation() {
		submitDisabled = true;

		const response = await fetch('/api/validate-answer', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				emojilang: currentQuestion?.emojilang,
				userAnswer: userTranslation
			})
		});

		const result = await response.json();

		if (result.isCorrect) {
			score += 10;
			correctAnswersInLevel++;
			feedback = 'Correct! +10 points';

			if (correctAnswersInLevel === 3) {
				currentLevel++;
				correctAnswersInLevel = 0;
				if (currentLevel <= 10) {
					feedback += ` Congratulations! You've advanced to level ${currentLevel}!`;
					await fetchQuestions(currentLevel);
				} else {
					gameActive = false;
					feedback = 'Congratulations! You completed all levels!';
					return;
				}
			}
		} else {
			feedback = `Incorrect. The correct answer is: "${result.correctAnswer}"`;
		}

		setTimeout(nextQuestion, 1000);
	}

	onMount(async () => {
		await fetchLevels();
		startGame();
	});
</script>

<div class="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
	<div class="p-6">
		<h2 class="text-2xl font-bold text-center mb-4">Emoji Translation Game</h2>

		<div class="text-4xl text-center mb-4">{currentQuestion?.emojilang}</div>

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
			<p class="font-semibold mb-1">
				Level {currentLevel}: {getCurrentLevelName()} | Total Score: {score}
			</p>
			<p class="text-sm text-gray-600">Correct answers in this level: {correctAnswersInLevel}/3</p>
			<div class="w-full bg-gray-200 rounded-full h-2.5">
				<div
					class="bg-blue-600 h-2.5 rounded-full"
					style="width: {(correctAnswersInLevel / 3) * 100}%"
				></div>
			</div>
		</div>

		{#if feedback}
			<p class="mt-4 text-sm text-gray-600">{feedback}</p>
		{/if}
	</div>
</div>
