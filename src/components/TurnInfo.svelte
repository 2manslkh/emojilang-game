<script lang="ts">
	import TimerBar from '$components/Timer/TimerBar.svelte';
	import { gameSettings } from '$lib/EmojiBattle/gameSettings';

	export let turn: number;
	export let currentPhase: 'preparation' | 'battle';
	export let phaseTimer: number;

	$: phaseEmoji = currentPhase === 'preparation' ? '🛠️' : '⚔️';
	$: phaseDuration =
		currentPhase === 'preparation'
			? gameSettings.PREPARATION_PHASE_DURATION
			: gameSettings.BATTLE_PHASE_DURATION;
</script>

<div class="text-left">
	<h2 class="text-xl font-semibold">Turn {turn}</h2>
	<p class="text-lg">Phase: {currentPhase} {phaseEmoji}</p>
	<div class="w-48 mt-2">
		<TimerBar timeRemaining={phaseTimer} totalTime={phaseDuration} />
	</div>
</div>
