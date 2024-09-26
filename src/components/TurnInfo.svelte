<script lang="ts">
	import TimerBar from '$components/Timer/TimerBar.svelte';

	export let turn: number;
	export let currentPhase: 'preparation' | 'battle';
	export let phaseTimer: number;
	export let phaseDuration: number;

	$: phaseEmoji = currentPhase === 'preparation' ? '🛠️' : '⚔️';
</script>

<div class="text-left">
	<h2 class="text-xl font-semibold">Turn {turn}</h2>
	<p class="text-lg">Phase: {currentPhase} {phaseEmoji}</p>
	<div class="w-48 mt-2">
		<TimerBar timeRemaining={phaseTimer} totalTime={phaseDuration} />
	</div>
</div>

<style>
	.transition-all {
		transition-property: all;
	}
	.duration-100 {
		transition-duration: 100ms;
	}
	.ease-linear {
		transition-timing-function: linear;
	}
</style>
