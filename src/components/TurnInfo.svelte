<script lang="ts">
	import TimerBar from '$components/Timer/TimerBar.svelte';
	import { gameSettings } from '$lib/EmojiBattle/gameSettings';

	export let turn: number;
	export let currentPhase: 'preparation' | 'battle';
	export let phaseTimer: number;

	$: phaseEmoji = currentPhase === 'preparation' ? '🛠️' : '⚔️';
	const getPhaseDuration = (phase: 'preparation' | 'battle') =>
		phase === 'preparation'
			? gameSettings.PREPARATION_PHASE_DURATION
			: gameSettings.BATTLE_PHASE_DURATION;
</script>

<div class="flex text-left justify-between py-2">
	<p class="text-lg font-semibold">Turn {turn} {phaseEmoji}</p>
	<div class="w-48 mt-2">
		<TimerBar
			timeRemaining={phaseTimer}
			totalTime={getPhaseDuration(currentPhase)}
			class="flex items-center gap-2"
		/>
	</div>
</div>
