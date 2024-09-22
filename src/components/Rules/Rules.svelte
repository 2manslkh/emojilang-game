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
				{ rule: '<predicate> ::= <verb_phrase> | <passive_phrase>' },
				{ rule: '<verb_phrase> ::= [<tense>] [<negation>] <verb>' },
				{ rule: '<passive_phrase> ::= 🔄 <verb_phrase>' },
				{ rule: '<question> ::= <sentence> ❓' }
			]
		},
		{
			category: 'Lexicon',
			description: 'Common emojis and their meanings',
			rules: [
				{
					rule: 'Pronouns: 👤 (I/Me), 👉 (You), 👨 (He/Him), 👩 (She/Her), 🔵 (It), 👥 (We/Us), 👥👥 (They/Them)'
				},
				{
					rule: 'Verbs: 🟰 (To be), 🚶 (To go), 🍽️ (To eat), ❤️ (To love), 👀 (To see), 👂 (To hear), 🗣️ (To speak)'
				},
				{ rule: 'Tenses: ⏪ (Past), ⏩ (Future), No marker for present' },
				{ rule: 'Modifiers: 🔝 (Big/Very), 🔽 (Small/Little), 🔁 (Often/Repeatedly)' },
				{ rule: 'Conjunctions: ➕ (And), 🔀 (Or), 🚫➡️ (But)' },
				{ rule: "Negation: ❌ (Not/Don't)" },
				{ rule: 'Question words: 🕐❓ (When), 📍❓ (Where), 🤔❓ (Why), 👤❓ (Who)' }
			]
		},
		{
			category: 'Semantic Roles',
			description: 'Roles played by sentence elements',
			rules: [
				{ rule: 'Agent: Doer of the action', example: '👤🚶 (I walk)' },
				{ rule: 'Patient: Receiver of the action', example: '🐕🍖 (Dog eats bone)' },
				{
					rule: 'Instrument: Tool used for the action',
					example: '👤✂️🧻 (I cut paper with scissors)'
				},
				{ rule: 'Recipient: Entity receiving something', example: '👤🎁👉 (I give you a gift)' }
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
				{ rule: 'Possessive: Place owned object after owner', example: '👤🏠 (My house)' },
				{ rule: 'Relative Clauses: Use 🔗', example: '👤👀🐕🔗🏃 (I see the dog that is running)' }
			]
		},
		{
			category: 'Cultural Context',
			description: 'Ensuring universal understanding',
			rules: [
				{ rule: '🌐 : Global context' },
				{ rule: '🇺🇳 : United Nations or international context' },
				{ rule: 'Use universally recognizable emojis when possible' },
				{ rule: 'Avoid culture-specific idioms or expressions' }
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
				{ rule: "'She doesn't like coffee but loves tea'", example: '👩❌❤️☕🚫➡️❤️🍵' },
				{ rule: "'The book I read yesterday was very interesting'", example: '👤⏪👀📕🔗🟰🔝🤔' }
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
