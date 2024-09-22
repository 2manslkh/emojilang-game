<script lang="ts">
	interface GrammarRule {
		category: string;
		rules: string[];
	}

	const grammarRules: GrammarRule[] = [
		{
			category: 'Basic Structure',
			rules: [
				'Subject + Verb + Object',
				'Adjectives come before nouns',
				'Adverbs come before verbs'
			]
		},
		{
			category: 'Pronouns',
			rules: [
				'I/Me: 👤',
				'You: 👉',
				'He/Him: 👨',
				'She/Her: 👩',
				'It: 🔵',
				'We/Us: 👥',
				'They/Them: 👥👥'
			]
		},
		{
			category: 'Common Verbs',
			rules: [
				'To be: 🟰',
				'To have: 🫴',
				'To go: 🚶',
				'To eat: 🍽️',
				'To drink: 🥤',
				'To see: 👀',
				'To hear: 👂',
				'To speak: 🗣️',
				'To love: ❤️',
				'To hate: 💢'
			]
		},
		{
			category: 'Tenses',
			rules: ['Past: ⏪ (before verb)', 'Present: No symbol (default)', 'Future: ⏩ (before verb)']
		},
		{
			category: 'Other',
			rules: [
				'Question mark: ❓ (at the end)',
				'Negation: ❌ (before verb)',
				'And: ➕',
				'Or: 🔀',
				'But: 🚫➡️'
			]
		},
		{
			category: 'Example Sentences',
			rules: [
				"'I love you': 👤 ❤️ 👉",
				"'The big dog eats a small bone': 🔝 🐕 🍽️ 🔽 🦴",
				"'We will go to the beach tomorrow': 👥 ⏩ 🚶 ➡️ 🏖️ 🔜",
				"'Do you like pizza?': 👉 ❤️ 🍕 ❓",
				"'She doesn't drink coffee': 👩 ❌ 🥤 ☕"
			]
		}
	];
</script>

<div class="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
	<h2 class="text-3xl font-bold text-center text-gray-800 mb-6">Emojilang Grammar Guide</h2>
	{#each grammarRules as section}
		<div class="mb-6">
			<h3 class="text-xl font-semibold text-gray-700 mb-2">{section.category}</h3>
			<ul class="list-disc pl-6">
				{#each section.rules as rule}
					<li class="text-gray-600 mb-1">{rule}</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>
