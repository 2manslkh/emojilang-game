<script lang="ts">
	interface GrammarRule {
		category: string;
		description: string;
		rules: Array<{ rule: string; examples?: string[] }>;
	}

	const grammarRules: GrammarRule[] = [
		{
			category: 'Nouns',
			description: 'Represented by emojis depicting objects, people, or concepts',
			rules: [
				{ rule: 'People', examples: ['👤 (person)', '👩 (woman)', '👨 (man)'] },
				{ rule: 'Places', examples: ['🏫 (school)', '🏠 (house)', '🏖️ (beach)'] },
				{ rule: 'Objects', examples: ['📕 (book)', '🍎 (apple)', '🚗 (car)'] },
				{ rule: 'Concepts', examples: ['❤️ (love)', '⚖️ (justice)', '💡 (idea)'] }
			]
		},
		{
			category: 'Verbs',
			description: 'Emojis showing actions or processes',
			rules: [
				{ rule: 'Action verbs', examples: ['🚶 (walk)', '🍽️ (eat)', '👀 (see)'] },
				{ rule: 'State verbs', examples: ['❤️ (love)', '💭 (think)', '🟰 (be)'] },
				{ rule: 'Process verbs', examples: ['🏗️ (build)', '📝 (write)', '🎨 (create)'] }
			]
		},
		{
			category: 'Adjectives & Adverbs',
			description: 'Placed after the noun/verb they modify',
			rules: [
				{ rule: 'Descriptive adjectives', examples: ['🔥 (hot)', '😊 (happy)', '🔝 (big)'] },
				{ rule: 'Adverbs of manner', examples: ['🏃 (quickly)', '🐌 (slowly)'] },
				{ rule: 'Adverbs of frequency', examples: ['🔁 (often)', '1️⃣ (once)'] }
			]
		},
		{
			category: 'Modifiers & Affixes',
			description: 'Attached directly to the emoji they modify',
			rules: [
				{ rule: 'Intensity modifiers', examples: ['⬆️ (very)', '⬇️ (slightly)'] },
				{ rule: 'Comparative', examples: ['🐘⬆️🔝🐁 (An elephant is bigger than a mouse)'] },
				{ rule: 'Superlative', examples: ['👤😊🔝 (I am the happiest)'] }
			]
		},
		{
			category: 'Tense & Aspect',
			description: 'Indicating when an action occurs',
			rules: [
				{ rule: 'Past tense: ⏪', examples: ['👤⏪🚶 (I walked)'] },
				{ rule: 'Future tense: ⏩', examples: ['👤⏩🚶 (I will walk)'] },
				{ rule: 'Present tense: No marker', examples: ['👤🚶 (I walk)'] },
				{ rule: 'Continuous aspect: 🔄', examples: ['👤🔄🚶 (I am walking)'] }
			]
		},
		{
			category: 'Negation',
			description: 'Expressing the opposite or absence of something',
			rules: [
				{
					rule: 'Use ❌ before the verb',
					examples: ["👤❌🚶 (I don't walk)", "👤❌❤️🍕 (I don't like pizza)"]
				}
			]
		},
		{
			category: 'Plurality & Quantity',
			description: 'Expressing multiple items or specific amounts',
			rules: [
				{ rule: 'Repeat emoji for plural', examples: ['🐈🐈 (cats)', '🌳🌳🌳 (trees)'] },
				{
					rule: 'Use numbers for specific quantities',
					examples: ['3️⃣🍎 (three apples)', '💯👤 (hundred people)']
				}
			]
		},
		{
			category: 'Possession',
			description: 'Showing ownership or belonging',
			rules: [
				{
					rule: 'Place owned object after owner',
					examples: ['👤🏠 (my house)', "🐕🦴 (dog's bone)"]
				}
			]
		},
		{
			category: 'Questions',
			description: 'Forming interrogative sentences',
			rules: [
				{
					rule: 'Add ❓ at the end of the sentence',
					examples: ['👤🚶❓ (Do I walk?)', '👉❤️🍕❓ (Do you like pizza?)']
				},
				{ rule: 'Who: 👤❓', examples: ['👤❓🚶➡️🏫 (Who walks to school?)'] },
				{ rule: 'What: 🤷❓', examples: ['🤷❓👉🍽️ (What do you eat?)'] },
				{ rule: 'When: 🕐❓', examples: ['🕐❓👥⏩🚶 (When will we go?)'] },
				{ rule: 'Where: 📍❓', examples: ['📍❓👉🏠 (Where do you live?)'] },
				{ rule: 'Why: 🤔❓', examples: ["🤔❓👤❌🚶 (Why don't I walk?)"] },
				{ rule: 'How: 🛠️❓', examples: ['🛠️❓👉🏗️🏠 (How do you build a house?)'] }
			]
		},
		{
			category: 'Example Sentences',
			description: 'Complex sentence structures demonstrating multiple rules',
			rules: [
				{ rule: 'The big dog often eats small bones', examples: ['🔝🐕🔁🍽️🔽🦴'] },
				{ rule: 'When will we go to the beach?', examples: ['🕐❓👥⏩🚶➡️🏖️'] },
				{
					rule: "If it's sunny tomorrow, I'll play tennis with my friend",
					examples: ['🎲☀️🔜👤⏩🎾👥']
				},
				{ rule: "She doesn't like coffee but loves tea", examples: ['👩❌❤️☕↔️❤️🍵'] },
				{ rule: 'The book I read yesterday was very interesting', examples: ['👤⏪👀📕🔗🟰⬆️🤔'] }
			]
		}
	];
</script>

<div class="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden p-6">
	<h2 class="text-3xl font-bold text-center text-gray-800 mb-6">Emojilang Grammar Guide</h2>
	{#each grammarRules as section}
		<div class="mb-6">
			<h3 class="text-xl font-semibold text-gray-700 mb-2">{section.category}</h3>
			<p class="text-gray-600 mb-2">{section.description}</p>
			<ul class="list-disc pl-6">
				{#each section.rules as { rule, examples }}
					<li class="text-gray-600 mb-1">
						{rule}
						{#if examples}
							<ul class="list-disc pl-6">
								{#each examples as example}
									<li class="text-gray-500">{example}</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>
