<script lang="ts">
	import type { Level, Question } from '$lib/emojilang/types';
	import { onMount } from 'svelte';

	let currentQuestion: Question | null = null;
	let userTranslation: string = '';
	let score: number = 0;
	let feedback: string = '';
	let submitDisabled: boolean = false;
	let currentLevel: number = 1;
	let levels: Record<number, Level> = {};
	$: levels;
	$: levelName = levels[currentLevel]?.name;
	let correctAnswersInLevel: number = 0;

	async function fetchLevels() {
		const response = await fetch('/api/levels');
		levels = await response.json();
	}

	function getCurrentLevelName(): string {
		return levels[currentLevel].name;
	}

	function getRandomQuestion(): Question {
		const index = Math.floor(Math.random() * levels[currentLevel].questions.length);
		console.log(levels[currentLevel].questions);
		console.log(index);
		return levels[currentLevel].questions[index];
	}

	async function startGame() {
		score = 0;
		currentLevel = 1;
		correctAnswersInLevel = 0;
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

		const response = await fetch('/api/ai/validatev2', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				correct_translation: currentQuestion?.answer,
				emojilang_expression: currentQuestion?.emojilang,
				user_translation: userTranslation
			})
		});

		console.log('🚀 | submitTranslation | response:', response);

		const result = await response.json();

		if (result.score >= 80) {
			// Assuming a score of 80 or above is considered correct
			score += 10;
			correctAnswersInLevel++;
			feedback = `Correct! +10 points. Accuracy: ${result.score}%`;
			// Remove the current question from the list
			levels[currentLevel].questions = levels[currentLevel].questions.filter(
				(q) => q.emojilang !== currentQuestion?.emojilang
			);

			if (correctAnswersInLevel === 3) {
				currentLevel++;
				correctAnswersInLevel = 0;
				if (currentLevel <= 10) {
					feedback += ` Congratulations! You've advanced to level ${currentLevel}!`;
					// await fetchQuestions(currentLevel);
				} else {
					feedback = 'Congratulations! You completed all levels!';
					return;
				}
			}
		} else {
			feedback = `Incorrect. The correct translation is: "${currentQuestion?.answer}". Accuracy: ${result.score}%`;
		}

		setTimeout(nextQuestion, 2000);
	}

	onMount(async () => {
		await fetchLevels();
		startGame();
	});
</script>

<div class="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
	<div class="p-6 flex flex-col">
		<h2 class="text-2xl font-bold text-center mb-4">Emoji Translation Game</h2>
		<h3 class="text-lg font-bold text-center mb-4">
			Level {currentLevel}: {levelName}
		</h3>

		<div class="flex-grow flex flex-col justify-between">
			<div>
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
						Total Score: {score}
					</p>
					<p class="text-sm text-gray-600">
						Correct answers in this level: {correctAnswersInLevel}/3
					</p>
					<div class="w-full bg-gray-200 rounded-full h-2.5">
						<div
							class="bg-blue-600 h-2.5 rounded-full"
							style="width: {(correctAnswersInLevel / 3) * 100}%"
						></div>
					</div>
				</div>
			</div>

			<div class="h-6">
				{#if feedback}
					<p class="text-sm text-gray-600">{feedback}</p>
				{/if}
			</div>
		</div>
	</div>
</div>
