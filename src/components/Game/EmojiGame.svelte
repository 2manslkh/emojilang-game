<script lang="ts">
	import { onMount } from 'svelte';
	import { EmojilangGame } from '$lib/emojilang/game';
	import { fade } from 'svelte/transition';

	let game: EmojilangGame;
	let userTranslation: string = '';
	let feedback: string = '';
	let submitDisabled: boolean = false;
	$: currentQuestion = game?.getCurrentQuestion();
	$: currentLevel = game?.getCurrentLevel() || 1;
	let levelName: string = '';
	$: score = game?.getScore() || 0;
	$: correctAnswersInLevel = game?.getCorrectAnswersInLevel() || 0;
	let inputElement: HTMLInputElement;
	let shakeComponent = false;
	let correctAudio: HTMLAudioElement;

	onMount(() => {
		correctAudio = new Audio('/correct.mp3');
		startGame();
	});

	async function startGame() {
		game = new EmojilangGame();
		await game.fetchLevels();
		game.startGame();
		currentQuestion = game.getCurrentQuestion();
		levelName = game.getCurrentLevelName();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !submitDisabled) {
			submitTranslation();
		}
	}

	async function submitTranslation() {
		submitDisabled = true;

		const result = await game.submitTranslation(userTranslation);
		feedback = result.feedback;
		score = result.score;
		correctAnswersInLevel = result.correctAnswersInLevel;

		if (result.correct) {
			correctAudio.play();
		} else {
			shakeComponent = true;
			setTimeout(() => {
				shakeComponent = false;
			}, 500);
		}

		if (!result.gameCompleted) {
			setTimeout(() => {
				game.nextQuestion();
				currentQuestion = game.getCurrentQuestion();
				currentLevel = game.getCurrentLevel();
				levelName = game.getCurrentLevelName();
				userTranslation = '';
				submitDisabled = false;

				if (result.correctAnswersInLevel === 3) {
					game.resetCorrectAnswersInLevel();
					correctAnswersInLevel = game.getCorrectAnswersInLevel();
				}
			}, 300);

			setTimeout(() => {
				inputElement.focus(); // Re-focus the input element
			}, 301);

			setTimeout(() => {
				feedback = '';
			}, 2000);
		}
	}
</script>

<div
	class="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden {shakeComponent
		? 'shake'
		: ''}"
	transition:fade
>
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
					bind:this={inputElement}
					placeholder="Enter your translation"
					class="w-full p-2 border rounded-md mb-4"
					disabled={submitDisabled}
					on:keydown={handleKeydown}
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

<style>
	@keyframes shake {
		0% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-5px);
		}
		50% {
			transform: translateX(5px);
		}
		75% {
			transform: translateX(-5px);
		}
		100% {
			transform: translateX(0);
		}
	}

	.shake {
		animation: shake 0.5s;
	}
</style>
