<script lang="ts">
	import { GITHUB_LINK, TELEGRAM_LINK } from '$lib/socials';
</script>

<div class="container mx-auto px-4 relative">
	<a
		href={GITHUB_LINK}
		target="_blank"
		rel="noopener noreferrer"
		class="text-blue-600 hover:text-blue-800 mr-4"
	>
		GitHub
	</a>
	<a
		href={TELEGRAM_LINK}
		target="_blank"
		rel="noopener noreferrer"
		class="text-blue-600 hover:text-blue-800"
	>
		Feedback
	</a>
	<span class="absolute right-0">v1.3.1</span>
</div>
