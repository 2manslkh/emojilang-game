<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
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
		getFinalGameState,
		endRoundAndKickInactivePlayer,
		getRoundHistory // Add this import
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

	let startTime: number;
	let animationFrameId: number;

	let gameSubscription: any;

	let playerRoundHistory: any[] = [];
	let opponentRoundHistory: any[] = [];

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
			endTimer(); // Make sure to cancel the animation frame when component is destroyed
		};
	});

	onDestroy(() => {
		if (gameSubscription) {
			gameSubscription.unsubscribe();
		}
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
		roundResult = '';
		startTime = performance.now();
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		updateTimer();
		subscribeToGameUpdates();
	}

	function updateTimer() {
		const currentTime = performance.now();
		const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
		timeLeft = Math.max(0, totalTime - elapsedTime);

		if (timeLeft > 0) {
			animationFrameId = requestAnimationFrame(updateTimer);
		} else {
			endTimer();
			endRound();
		}
	}

	function endTimer() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = 0;
		}
	}

	async function endRound() {
		if (!gameSession || gameState !== 'playing') {
			console.error('No active game session or round already ended');
			return;
		}

		// Set gameState to 'result' immediately to prevent multiple calls
		gameState = 'result';

		const updatedGame = await endRoundAndKickInactivePlayer(gameSession.id);
		if (!updatedGame) {
			console.error('Failed to end round and kick inactive player');
			return;
		}

		// Check if the current player was kicked
		if (
			updatedGame.player1_id !== currentPlayer!.id &&
			updatedGame.player2_id !== currentPlayer!.id
		) {
			// Player was kicked
			currentPlayer = null;
			opponent = null;
			gameState = 'waiting';
			alert('You were removed from the game due to inactivity.');
			return;
		}

		// Determine which choice belongs to the current player
		playerChoice =
			updatedGame.player1_id === currentPlayer!.id
				? updatedGame.player1_choice
				: updatedGame.player2_choice;
		opponentChoice =
			updatedGame.player1_id === currentPlayer!.id
				? updatedGame.player2_choice
				: updatedGame.player1_choice;

		if (playerChoice === null) {
			console.error('Current player choice is missing');
			return;
		}

		let result;
		if (opponentChoice === null) {
			result = {
				message: 'Your opponent did not make a choice. You gain 1 point.',
				playerPoints: 1,
				opponentPoints: 0
			};
		} else {
			result = calculateResult(playerChoice, opponentChoice);
		}

		roundResult = result.message;

		// Update round history only once
		if (roundHistory[0] !== playerChoice) {
			updateRoundHistory();
		}

		// Update the gameSession with the round result
		gameSession = {
			...updatedGame,
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
		} else if (playerChoice === 'betray' && opponentChoice === 'betray') {
			return {
				message: 'Both betrayed! You each lose 1 point.',
				playerPoints: -1,
				opponentPoints: -1
			};
		} else {
			return {
				message: 'Invalid choice',
				playerPoints: 0,
				opponentPoints: 0
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
		fetchRoundHistory();
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
			fetchRoundHistory();
		} else if ($currentGame.status === 'finished' && gameState !== 'result') {
			endRound();
			fetchRoundHistory();
		}
	}

	async function handleChoice(choice: 'cooperate' | 'betray') {
		if (!gameSession || playerChoice !== null || gameState !== 'playing') {
			console.error('Invalid game state or choice already made');
			return;
		}

		playerChoice = choice;
		updateRoundHistory(); // Update history immediately after making a choice

		const updatedGame = await makeChoice(gameSession.id, currentPlayer!.id, choice);

		if (!updatedGame) {
			console.error('Failed to make choice');
			return;
		}

		// We don't need to end the round here anymore, as it will be handled by the subscription
	}

	function subscribeToGameUpdates() {
		if (gameSubscription) {
			gameSubscription.unsubscribe();
		}

		if (!gameSession) return;

		gameSubscription = supabase
			.channel(`game_${gameSession.id}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'game_sessions',
					filter: `id=eq.${gameSession.id}`
				},
				(payload) => {
					const updatedGame = payload.new as GameSession;
					if (updatedGame.player1_choice !== null && updatedGame.player2_choice !== null) {
						endRound();
					}
				}
			)
			.subscribe();
	}

	async function fetchRoundHistory() {
		if (currentPlayer && opponent) {
			playerRoundHistory = await getRoundHistory(currentPlayer.id);
			opponentRoundHistory = await getRoundHistory(opponent.id);
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
			{#if opponentChoice !== null}
				<p class="text-lg mb-4">Opponent chose: {opponentChoice === 'cooperate' ? '🤝' : '🔪'}</p>
			{:else}
				<p class="text-lg mb-4">Opponent did not make a choice ⏳</p>
			{/if}
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

	{#if currentPlayer && opponent}
		<div class="mt-8">
			<h3 class="text-lg font-semibold mb-2">Round History:</h3>
			<div class="flex justify-between">
				<div class="w-1/2 pr-2">
					<h4 class="text-md font-semibold">{currentPlayer.name}'s History:</h4>
					<div class="flex space-x-2">
						{#each playerRoundHistory as choice}
							<span class="text-2xl">{choice.choice === 'cooperate' ? '🤝' : '🔪'}</span>
						{/each}
					</div>
				</div>
				<div class="w-1/2 pl-2">
					<h4 class="text-md font-semibold">{opponent.name}'s History:</h4>
					<div class="flex space-x-2">
						{#each opponentRoundHistory as choice}
							<span class="text-2xl">{choice.choice === 'cooperate' ? '🤝' : '🔪'}</span>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
