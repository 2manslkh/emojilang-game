<script lang="ts">
	import { onMount } from 'svelte';
	import {
		players,
		joinGame,
		watchPlayers,
		leaveGame,
		findOpponent,
		makeChoice,
		waitForOpponentChoice,
		currentGame,
		watchGameSessions,
		type GameSession,
		supabase,
		getFinalGameState
	} from '$lib/EmojiSteal/client';
	import { TimerBar } from '$components/Timer';
	import type { Player } from '$lib/EmojiSteal/client';

	let playerName = '';
	let currentPlayer: { id: string; name: string; emoji: string } | null = null;
	let joinError = '';
	let opponent: { id: string; name: string; emoji: string } | null = null;
	let roundHistory: string[] = [];
	let timeLeft = 15;
	let gameState: 'waiting' | 'playing' | 'result' = 'waiting';
	let playerChoice: 'cooperate' | 'betray' | null = null;
	let opponentChoice: 'cooperate' | 'betray' | null = null;
	let roundResult = '';
	let gameSession: GameSession | null = null;

	let totalTime = 15; // Change to 15 seconds

	let timer: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		const unsubscribe = watchPlayers();
		const unsubscribeGame = currentGame.subscribe((value) => {
			gameSession = value;
		});

		return () => {
			unsubscribe();
			unsubscribeGame();
			if (currentPlayer) {
				leaveGame(currentPlayer.id);
			}
		};
	});

	async function handleJoin() {
		if (playerName.trim()) {
			const joinedPlayer = await joinGame(playerName.trim());
			if (joinedPlayer) {
				console.log(`Player ${joinedPlayer.name} (ID: ${joinedPlayer.id}) has joined the game`);
				currentPlayer = joinedPlayer;
				joinError = '';
				startMatchmaking();
			} else {
				joinError = 'Username already exists or an error occurred. Please try again.';
			}
		}
	}

	async function startMatchmaking() {
		const result = await findOpponent(currentPlayer!.id);
		if (result && result.opponent) {
			gameState = 'playing';
			opponent = result.opponent;
			startRound();
		} else if (result) {
			gameState = 'waiting';
			// The unsubscribe function is now returned from findOpponent
			const unsubscribe = result.unsubscribe;

			// Set up a store subscription to handle game updates
			const unsubscribeGame = currentGame.subscribe((game) => {
				if (game && game.status === 'playing' && game.player1_id && game.player2_id) {
					const opponentId =
						game.player1_id === currentPlayer!.id ? game.player2_id : game.player1_id;
					supabase
						.from('players')
						.select('*')
						.eq('id', opponentId)
						.single()
						.then(({ data }) => {
							if (data) {
								opponent = data as { id: string; name: string; emoji: string };
								gameState = 'playing';
								startRound();
								unsubscribe(); // Unsubscribe from game session changes
								unsubscribeGame(); // Unsubscribe from currentGame store
							}
						});
				}
			});

			// Optionally, set up a timeout
			setTimeout(() => {
				if (gameState === 'waiting') {
					console.log('Matchmaking timed out');
					unsubscribe(); // Unsubscribe from game session changes
					unsubscribeGame(); // Unsubscribe from currentGame store
					// Handle timeout (e.g., show a message to the user)
				}
			}, 30000); // 30 seconds timeout
		}
	}

	function startRound() {
		gameState = 'playing';
		timeLeft = totalTime;
		playerChoice = null;
		opponentChoice = null;
		timer = setInterval(() => {
			timeLeft = Math.max(0, timeLeft - 0.1);
			if (timeLeft <= 0) {
				endTimer();
				if (!playerChoice) {
					handleChoice(Math.random() < 0.5 ? 'cooperate' : 'betray');
				} else {
					endRound();
				}
			}
		}, 100);
	}

	function endTimer() {
		if (timer !== null) {
			clearInterval(timer);
			timer = null;
		}
	}

	async function handleChoice(choice: 'cooperate' | 'betray') {
		if (!gameSession) {
			console.error('No active game session');
			return;
		}

		playerChoice = choice;
		await makeChoice(gameSession.id, currentPlayer!.id, choice);

		// Only end the round if the timer has run out
		if (timeLeft <= 0) {
			endTimer();
			endRound();
		}
	}

	async function endRound() {
		if (!gameSession) {
			console.error('No active game session');
			return;
		}

		const finalGameState = await getFinalGameState(gameSession.id);
		if (!finalGameState) {
			console.error('Failed to fetch final game state');
			return;
		}

		gameState = 'result';
		opponentChoice =
			finalGameState.player1_id === currentPlayer!.id
				? finalGameState.player2_choice
				: finalGameState.player1_choice;

		if (playerChoice === null || opponentChoice === null) {
			console.error('Missing player choices');
			return;
		}

		const result = calculateResult(playerChoice, opponentChoice);
		roundResult = result.message;
		updateRoundHistory();

		// Update the gameSession with the round result
		gameSession = {
			...finalGameState,
			round_result: roundResult
		};

		// Set a timeout to start the next round
		setTimeout(() => {
			startMatchmaking();
		}, 5000); // Show results for 5 seconds
	}

	function calculateResult(
		playerChoice: 'cooperate' | 'betray',
		opponentChoice: 'cooperate' | 'betray'
	) {
		if (playerChoice === 'cooperate' && opponentChoice === 'cooperate') {
			return {
				message: 'Both cooperated! You each gain 2 points.',
				playerPoints: 2,
				opponentPoints: 2
			};
		} else if (playerChoice === 'betray' && opponentChoice === 'cooperate') {
			return {
				message: 'You betrayed! You gain 3 points, opponent gains 0.',
				playerPoints: 3,
				opponentPoints: 0
			};
		} else if (playerChoice === 'cooperate' && opponentChoice === 'betray') {
			return {
				message: 'You were betrayed! You gain 0 points, opponent gains 3.',
				playerPoints: 0,
				opponentPoints: 3
			};
		} else {
			return {
				message: 'Both betrayed! You each lose 1 point.',
				playerPoints: -1,
				opponentPoints: -1
			};
		}
	}

	function updateRoundHistory() {
		roundHistory = [playerChoice!, ...roundHistory].slice(0, 6);
	}

	$: playerCount = $players.length;

	$: if ($currentGame && $currentGame.status === 'playing' && !opponent) {
		const opponentId =
			$currentGame.player1_id === currentPlayer!.id
				? $currentGame.player2_id
				: $currentGame.player1_id;
		supabase
			.from('players')
			.select('*')
			.eq('id', opponentId)
			.single()
			.then(({ data }) => {
				if (data) {
					opponent = data as { id: string; name: string; emoji: string };
					startRound();
				}
			});
	}

	$: if ($currentGame) {
		if ($currentGame.status === 'playing' && gameState !== 'playing') {
			gameState = 'playing';
			const opponentId =
				$currentGame.player1_id === currentPlayer!.id
					? $currentGame.player2_id
					: $currentGame.player1_id;
			supabase
				.from('players')
				.select('*')
				.eq('id', opponentId)
				.single()
				.then(({ data }) => {
					if (data) {
						opponent = data as { id: string; name: string; emoji: string };
						startRound();
					}
				});
		} else if ($currentGame.status === 'finished' && gameState !== 'result') {
			endRound();
		}
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold mb-4">EmojiSteal Game</h1>
	<p class="mb-4 text-gray-600">
		{playerCount}
		{playerCount === 1 ? 'player' : 'players'} connected
	</p>

	{#if !currentPlayer}
		<div class="flex flex-col items-center justify-center">
			<input
				type="text"
				bind:value={playerName}
				placeholder="Enter your name"
				class="mb-4 p-2 border rounded"
			/>
			<button on:click={handleJoin} class="bg-blue-500 text-white px-4 py-2 rounded">
				Join Game
			</button>
			{#if joinError}
				<p class="text-red-500 mt-2">{joinError}</p>
			{/if}
		</div>
	{:else if gameState === 'waiting'}
		<p>Waiting for an opponent...</p>
	{:else if gameState === 'playing'}
		<div class="text-center">
			<h2 class="text-xl mb-4">Playing against {opponent?.name}</h2>
			{#if gameSession}
				<p class="text-sm text-gray-500 mb-2">Game ID: {gameSession.id}</p>
			{/if}
			<TimerBar timeRemaining={timeLeft} {totalTime} class="mb-4" />
			{#if playerChoice === null}
				<div class="flex justify-center space-x-4">
					<button
						on:click={() => handleChoice('cooperate')}
						class="bg-green-500 text-white px-6 py-3 rounded text-xl"
					>
						🤝 Cooperate
					</button>
					<button
						on:click={() => handleChoice('betray')}
						class="bg-red-500 text-white px-6 py-3 rounded text-xl"
					>
						🔪 Betray
					</button>
				</div>
			{:else}
				<p class="text-2xl mb-4">
					Your choice: {playerChoice === 'cooperate' ? '🤝 Cooperate' : '🔪 Betray'}
				</p>
				<p class="text-xl mb-4">Waiting for opponent's choice...</p>
			{/if}
		</div>
	{:else if gameState === 'result'}
		<div class="text-center">
			<h2 class="text-xl mb-4">Round Result</h2>
			{#if gameSession}
				<p class="text-sm text-gray-500 mb-2">Game ID: {gameSession.id}</p>
			{/if}
			<p class="text-lg mb-2">You chose: {playerChoice === 'cooperate' ? '🤝' : '🔪'}</p>
			<p class="text-lg mb-4">Opponent chose: {opponentChoice === 'cooperate' ? '🤝' : '🔪'}</p>
			<p class="text-xl font-bold mb-4">{roundResult}</p>
			<p class="text-lg">Next round starting soon...</p>
		</div>
	{/if}

	{#if currentPlayer && roundHistory.length > 0}
		<div class="mt-8">
			<h3 class="text-lg font-semibold mb-2">Your Round History:</h3>
			<div class="flex space-x-2">
				{#each roundHistory as choice}
					<span class="text-2xl">{choice === 'cooperate' ? '🤝' : '🔪'}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
