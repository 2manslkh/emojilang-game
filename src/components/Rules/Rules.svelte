<script lang="ts">
	interface GrammarRule {
		category: string;
		description: string;
		rules: Array<{ rule: string; example?: string }>;
	}

	const grammarRules: GrammarRule[] = [
		{
			category: 'Formal Grammar',
			description: 'Basic sentence structure in Emojilang',
			rules: [
				{ rule: '<sentence> ::= [<question>] <subject> <predicate> [<object>] [<modifiers>]' },
				{ rule: '<subject> ::= <noun_phrase> | <pronoun>' },
				{ rule: '<predicate> ::= <verb_phrase> | <passive_phrase>' }
			]
		},
		{
			category: 'Lexicon',
			description: 'Common emojis and their meanings',
			rules: [
				{
					rule: 'Pronouns: 👤 (I/Me), 👉 (You), 👨 (He/Him), 👩 (She/Her), 🔵 (It), 👥 (We/Us), 👥👥 (They/Them)'
				},
				{ rule: 'Verbs: 🟰 (To be), 🚶 (To go), 🍽️ (To eat), ❤️ (To love)' },
				{ rule: 'Tenses: ⏪ (Past), ⏩ (Future)' }
			]
		},
		{
			category: 'Semantic Roles',
			description: 'Roles played by sentence elements',
			rules: [
				{ rule: 'Agent: Doer of the action', example: '👤🚶 (I walk)' },
				{ rule: 'Patient: Receiver of the action', example: '🐕🍖 (Dog eats bone)' }
			]
		},
		{
			category: 'Cultural Context',
			description: 'Ensuring universal understanding',
			rules: [
				{ rule: '🌐 : Global context' },
				{ rule: '🇺🇳 : United Nations or international context' }
			]
		},
		{
			category: 'Example Sentences',
			description: 'Complex sentence structures',
			rules: [
				{ rule: "'The big dog often eats small bones'", example: '🔝🐕🔁🍽️🔽🦴' },
				{ rule: "'When will we go to the beach?'", example: '🕐❓👥⏩🚶➡️🏖️' }
			]
		}
	];
</script>

<div class="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
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
