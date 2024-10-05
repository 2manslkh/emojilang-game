<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';

	export let totalTime: number;
	export let isRunning: boolean = false;

	let timeRemaining: number = totalTime;
	let startTime: number;
	let animationFrameId: number;

	const dispatch = createEventDispatcher();

	$: progress = (timeRemaining / totalTime) * 100;
	$: color = progress > 50 ? 'bg-green-500' : progress > 25 ? 'bg-yellow-500' : 'bg-red-500';

	function updateTimer() {
		const currentTime = performance.now();
		const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
		timeRemaining = Math.max(0, totalTime - elapsedTime);

		if (timeRemaining > 0 && isRunning) {
			animationFrameId = requestAnimationFrame(updateTimer);
		} else if (timeRemaining <= 0) {
			dispatch('timerEnd');
			isRunning = false;
		}
	}

	function startTimer() {
		timeRemaining = totalTime;
		startTime = performance.now();
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		updateTimer();
	}

	function stopTimer() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = 0;
		}
	}

	$: if (isRunning) {
		startTimer();
	} else {
		stopTimer();
	}

	onDestroy(() => {
		stopTimer();
	});
</script>

<div class={$$props.class}>
	<div class="w-full bg-gray-200 rounded-full h-2.5 relative">
		<div
			class="{color} h-2.5 rounded-full transition-all duration-1000 ease-linear"
			style="width: {progress}%"
		></div>
	</div>
	<div class="text-xs text-gray-600">
		{Math.ceil(timeRemaining)}s
	</div>
</div>
