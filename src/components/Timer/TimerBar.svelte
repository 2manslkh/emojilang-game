<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';

	export let totalTime: number;
	export let startTime: string | undefined;

	let timeRemaining: number = totalTime;
	let animationFrameId: number;

	const dispatch = createEventDispatcher();

	$: progress = (timeRemaining / totalTime) * 100;
	$: color = progress > 50 ? 'bg-green-500' : progress > 25 ? 'bg-yellow-500' : 'bg-red-500';

	function updateTimer() {
		if (!startTime) return;

		const currentTime = new Date().getTime();
		const startTimeMs = new Date(startTime).getTime();
		const elapsedTime = (currentTime - startTimeMs) / 1000; // Convert to seconds
		timeRemaining = Math.max(0, totalTime - elapsedTime);

		if (timeRemaining > 0) {
			animationFrameId = requestAnimationFrame(updateTimer);
		} else {
			dispatch('timerEnd');
		}
	}

	$: if (startTime) {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		updateTimer();
	}

	onDestroy(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
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
