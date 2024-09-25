<script lang="ts">
	export let timeRemaining: number;
	export let totalTime: number;

	$: progress = (timeRemaining / totalTime) * 100;
	$: color = progress > 50 ? 'bg-green-500' : progress > 25 ? 'bg-yellow-500' : 'bg-red-500';
</script>

<div class="w-full bg-gray-200 rounded-full h-2.5 mb-4 relative">
	<div
		class="{color} h-2.5 rounded-full transition-all duration-1000 ease-linear"
		style="width: {progress}%"
	></div>
	<div class="absolute right-0 top-3 text-xs text-gray-600">
		{Math.ceil(timeRemaining)}s
	</div>
</div>
