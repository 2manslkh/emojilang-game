<script lang="ts">
	export let turn: number;
	export let currentPhase: 'preparation' | 'battle';
	export let phaseTimer: number;
	export let phaseDuration: number;
</script>

<div class="text-center">
	<h2 class="text-xl font-semibold">Turn {turn}</h2>
	<p class="text-lg">Phase: {currentPhase}</p>
	<p class="text-lg">Time: {phaseTimer}s</p>
	<div class="w-48 h-4 bg-gray-200 rounded-full mt-2">
		<div
			class="h-full bg-blue-500 rounded-full"
			style="width: {(phaseTimer / phaseDuration) * 100}%"
		></div>
	</div>
</div>
