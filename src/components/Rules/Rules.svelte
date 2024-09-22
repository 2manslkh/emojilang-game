<script lang="ts">
	interface GrammarRule {
		category: string;
		description: string;
		rules: Array<{ rule: string; example?: string }>;
	}

	const grammarRules: GrammarRule[] = [
		{
			category: 'Core Principles',
			description: 'Fundamental concepts of Emojilang',
			rules: [
				{ rule: 'Visual Communication: Use emojis as primary means of expression' },
				{ rule: 'Simplicity and Intuitiveness: Easy-to-learn structure' },
				{ rule: 'Expressiveness: Convey a wide range of ideas' },
				{ rule: 'Cultural Neutrality: Inclusive and adaptable across cultures' },
				{ rule: 'Machine Readability: Structured for easy parsing and translation' }
			]
		},
		{
			category: 'Vocabulary',
			description: 'Basic elements of Emojilang',
			rules: [
				{
					rule: 'Nouns: Represented by emojis depicting objects, people, or concepts',
					example: '👤 (person), 🏫 (school)'
				},
				{ rule: 'Verbs: Emojis showing actions or processes', example: '🚶 (walk), 📝 (write)' },
				{
					rule: 'Adjectives/Adverbs: Placed after the noun/verb they modify',
					example: '🔥 (hot), 😊 (happy)'
				},
				{
					rule: 'Modifiers: Attached directly to the emoji they modify',
					example: '⬆️ (very), 🔁 (often)'
				}
			]
		},
		{
			category: 'Grammar and Syntax',
			description: 'Sentence structure and grammatical rules',
			rules: [
				{
					rule: 'Basic Structure: Subject (S) + Verb (V) + Object (O)',
					example: '[S]👤 [V]🚶 [O]🏫 (I walk to school)'
				},
				{
					rule: 'Tense: ⏪ (Past), ⏩ (Future), No marker for present',
					example: '👤⏪🚶 (I walked)'
				},
				{ rule: 'Negation: Use ❌ before the verb', example: "👤❌🚶 (I don't walk)" },
				{ rule: 'Questions: Add ❓ at the end of the sentence', example: '👤🚶❓ (Do I walk?)' },
				{ rule: 'Passive Voice: Use 🔄 before the verb', example: '🏠🔄🏗️ (The house is built)' }
			]
		},
		{
			category: 'Advanced Structures',
			description: 'Complex grammatical constructions',
			rules: [
				{
					rule: 'Conditional: Use 🎲 to indicate "if/when"',
					example: '🎲🌧️👤⏩🏠 (If it rains, I will stay home)'
				},
				{
					rule: 'Comparative: Use ⬆️ or ⬇️',
					example: '🐘⬆️🔝🐁 (An elephant is bigger than a mouse)'
				},
				{ rule: 'Superlative: Use 🔝 after the adjective', example: '👤😊🔝 (I am the happiest)' },
				{ rule: 'Conjunctions: & (and), | (or), ↔️ (but)', example: '👤🚶&🏃 (I walk and run)' },
				{ rule: 'Abstract Concepts: Combine emojis', example: '⚖️ (justice), 💭💡 (hypothesis)' }
			]
		},
		{
			category: 'Cultural Adaptability',
			description: 'Ensuring universal understanding',
			rules: [
				{
					rule: 'Context Markers: 🌐 (Global), 🇺🇳 (International)',
					example: '🌐👤🗣️ (I speak globally)'
				},
				{ rule: 'Use universally recognizable emojis when possible' },
				{ rule: 'Avoid culture-specific idioms or expressions' }
			]
		},
		{
			category: 'Machine Compatibility',
			description: 'Features for NLP and machine translation',
			rules: [
				{ rule: 'Formal Grammar Specification: Define syntax rules for parsing' },
				{ rule: 'Unique Codes: Assign codes to each emoji for processing' },
				{ rule: 'Provide machine-readable resources (JSON, XML)' }
			]
		},
		{
			category: 'Example Sentences',
			description: 'Complex sentence structures',
			rules: [
				{ rule: "'The big dog often eats small bones'", example: '🔝🐕🔁🍽️🔽🦴' },
				{ rule: "'When will we go to the beach?'", example: '🕐❓👥⏩🚶➡️🏖️' },
				{
					rule: "'If it's sunny tomorrow, I'll play tennis with my friend'",
					example: '🎲☀️🔜👤⏩🎾👥'
				},
				{ rule: "'She doesn't like coffee but loves tea'", example: '👩❌❤️☕↔️❤️🍵' },
				{ rule: "'The book I read yesterday was very interesting'", example: '👤⏪👀📕🔗🟰⬆️🤔' }
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
				{#each section.rules as { rule, example }}
					<li class="text-gray-600 mb-1">
						{rule}
						{#if example}
							<span class="text-gray-500 italic"> - Example: {example}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>
