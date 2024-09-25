<script lang="ts">
	const emojiRushRules = [
		{
			title: 'Game Objective',
			rules: [
				'You have 180 seconds (3 minutes) to score as many points as possible.',
				'Translate emoji combinations into crypto-related terms or concepts.',
				'The faster and more accurately you answer, the higher your score!'
			]
		},
		{
			title: 'Basic Emoji Dictionary',
			rules: [
				'🪙 = token / coin',
				'⛓️ = chain',
				'🧱 = block',
				'🔒 = security / encryption',
				'💼 = wallet',
				'📈 = market (rising)',
				'📉 = market (falling)',
				'💧 = liquidity',
				'🏦 = bank / finance',
				'🔗 = link / connection',
				'🌐🔀 = Decentralized'
			]
		},
		{
			title: 'Game Mechanics',
			rules: [
				"You'll be presented with emoji combinations representing crypto terms.",
				'Type your answer in the provided field.',
				'Submit your answer quickly to earn more points.',
				'Correct answers earn points, while incorrect answers earn no points.',
				'The game progresses through different levels of difficulty.'
			]
		},
		{
			title: 'Tips for Success',
			rules: [
				'Familiarize yourself with common crypto terms and concepts before playing.',
				'Look for combinations of emojis that might represent longer phrases or names.',
				'Pay attention to subtle differences in emojis that might change the meaning.',
				"Don't spend too long on any single question - if you're unsure, make your best guess and move on."
			]
		},
		{
			title: 'Example Questions',
			rules: [
				'🧱🔗 = Blockchain',
				'🖼️🔒 = NFT (Non-Fungible Token)',
				'👥🏛️ = DAO (Decentralized Autonomous Organization)',
				'💧💰🏊 = Liquidity Pool',
				'🔒💎 = Staking'
			]
		}
	];
</script>

<div class="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
	<h1 class="text-3xl font-bold text-center mb-6">EmojiRush: Crypto Edition Rules</h1>

	{#each emojiRushRules as section}
		<div class="mb-6">
			<h2 class="text-xl font-semibold mb-2">{section.title}</h2>
			<ul class="list-disc pl-6 space-y-2">
				{#each section.rules as rule}
					<li class="text-gray-700">{rule}</li>
				{/each}
			</ul>
		</div>
	{/each}

	<div class="mt-8 text-center">
		<p class="text-lg font-semibold">
			Good luck, and may your crypto knowledge lead you to victory in EmojiRush: Crypto Edition!
		</p>
	</div>
</div>
