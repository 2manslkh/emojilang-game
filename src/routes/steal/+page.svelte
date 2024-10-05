<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		joinGame,
		leaveGame,
		makeChoice,
		currentPlayer,
		opponent,
		getPlayerData,
		getPlayerHistory,
		getCurrentGameSession
	} from '$lib/EmojiSteal/client';
	import { joinQueue, removeFromMatchmaking } from '$lib/EmojiSteal/matchmaking';
	import { TimerBar } from '$components/Timer';

	import JoinGameForm from './JoinGameForm.svelte';
	import WaitingForOpponent from './WaitingForOpponent.svelte';
	import GamePlay from './GamePlay.svelte';
	import RoundResult from './RoundResult.svelte';
	import PlayerHistory from './PlayerHistory.svelte';
	import OpponentHistory from './OpponentHistory.svelte';
	import WaitingForOpponentChoice from './WaitingForOpponentChoice.svelte';

	import {
		initializeWatchers,
		unsubscribeAll,
		subscribeToUserRoundHistory,
		playersInQueue,
		currentGameSession,
		subscribeToMatchmakingQueue
	} from '$lib/EmojiSteal/watcher';
	import type { Choice, GameSession } from '$lib/EmojiSteal/types';
	import { playerLogger, gameLogger, matchmakingLogger } from '$lib/logging';
	import PlayersInQueue from './PlayersInQueue.svelte';

	let playerName = '';
	let joinError = '';
	let roundResult = '';

	let totalTime = 15;

	let unsubscribeFromSpecificGame: (() => void) | null = null;
	let unsubscribeFromUserRoundHistory: (() => void) | null = null;

	// Make gameState reactive based on currentGameSession and currentPlayer
	$: gameState = getGameState($currentGameSession, $currentPlayer?.id);

	// Derive playerChoice and opponentChoice from currentGameSession and currentPlayer
	$: playerChoice = getPlayerChoice($currentGameSession, $currentPlayer?.id);
	$: opponentChoice = getOpponentChoice($currentGameSession, $currentPlayer?.id);

	function getGameState(
		session: GameSession | null,
		playerId: string | undefined
	): 'waiting' | 'playing' | 'choosing' | 'result' {
		if (!session || !playerId) return 'waiting';

		if (session.status === 'waiting') return 'waiting';
		if (session.status === 'finished') return 'result';

		const playerChoice = getPlayerChoice(session, playerId);
		const opponentChoice = getOpponentChoice(session, playerId);

		if (playerChoice === null) return 'playing';
		if (opponentChoice === null) return 'choosing';

		return 'result';
	}

	function getPlayerChoice(
		session: GameSession | null,
		playerId: string | undefined
	): 'cooperate' | 'betray' | 'no_choice' {
		if (!session || !playerId) return 'no_choice';
		return session.player1_id === playerId ? session.player1_choice : session.player2_choice;
	}

	function getOpponentChoice(
		session: GameSession | null,
		playerId: string | undefined
	): 'cooperate' | 'betray' | 'no_choice' {
		if (!session || !playerId) return 'no_choice';
		return session.player1_id === playerId ? session.player2_choice : session.player1_choice;
	}

	onMount(() => {
		subscribeToMatchmakingQueue();
		if ($currentPlayer) {
			initializeWatchers($currentPlayer.id);
		}
	});

	onDestroy(() => {
		if (unsubscribeFromSpecificGame) {
			unsubscribeFromSpecificGame();
		}
		if (unsubscribeFromUserRoundHistory) {
			unsubscribeFromUserRoundHistory();
		}

		unsubscribeAll();
		if ($currentPlayer) {
			leaveGame($currentPlayer.id);
		}
	});

	$: if ($currentGameSession) {
		handleGameSessionChange($currentGameSession);
	}

	async function handleJoin() {
		if (playerName.trim()) {
			const joinedPlayer = await joinGame(playerName.trim());
			if (joinedPlayer) {
				playerLogger.info(
					`Player ${joinedPlayer.name} (ID: ${joinedPlayer.id}) has joined the game`
				);
				currentPlayer.set(joinedPlayer);
				joinError = '';
				unsubscribeFromUserRoundHistory = subscribeToUserRoundHistory(joinedPlayer.id);

				// Fetch the current game session if the player is in a game
				if (joinedPlayer.current_game_id) {
					const currentSession = await getCurrentGameSession(joinedPlayer.current_game_id);
					if (currentSession) {
						currentGameSession.set(currentSession);
						handleGameSessionChange(currentSession);

						// Fetch opponent data if available
						if (currentSession.player1_id && currentSession.player2_id) {
							const opponentId =
								currentSession.player1_id === joinedPlayer.id
									? currentSession.player2_id
									: currentSession.player1_id;
							const opponentData = await getPlayerData(opponentId);
							if (opponentData) {
								opponent.set(opponentData);
							}
						}
					}
				} else {
					startMatchmaking();
				}
			} else {
				playerLogger.warn('Failed to join game');
				joinError = 'Username already exists or an error occurred. Please try again.';
			}
		}
	}

	async function startMatchmaking() {
		if (!$currentPlayer) {
			matchmakingLogger.error('No current player');
			return;
		}

		matchmakingLogger.info(`Starting matchmaking for player ${$currentPlayer.id}`);

		// Close the previous game subscription before starting a new game
		if (unsubscribeFromSpecificGame) {
			unsubscribeFromSpecificGame();
			unsubscribeFromSpecificGame = null;
		}

		await joinQueue($currentPlayer.id);
		matchmakingLogger.info('Joined matchmaking queue, waiting for opponent');

		// The opponent and game session will be set through the real-time subscription
		// when a match is found on the server side
	}

	async function handleGameSessionChange(session: GameSession | null) {
		if (!session) return;

		gameLogger.data('Game session updated', session);

		if (session.status === 'playing') {
			const playerChoice = getPlayerChoice(session, $currentPlayer?.id);
			if (playerChoice === null) {
				gameState = 'playing';
				startRound(); // Start the timer when the game state changes to 'playing'
			} else {
				gameState = 'choosing';
			}
		} else if (session.status === 'finished') {
			gameState = 'result';
			endRound();
		}

		currentGameSession.set(session);
	}

	function startRound() {
		roundResult = '';
	}

	function handleTimerEnd() {
		if (gameState === 'playing') {
			// If the timer ends and the player hasn't made a choice, make a random choice
			handleChoice(null);
		}
	}

	async function endRound() {
		if (!$currentGameSession) {
			console.error('No active game session');
			return;
		}
		try {
			let result = calculateResult(playerChoice, opponentChoice);

			roundResult = result.message;

			await fetchRoundHistory();

			setTimeout(() => {
				startMatchmaking();
			}, 5000);
		} catch (error) {
			console.error('Error in endRound:', error);
		}
	}

	function calculateResult(
		playerChoice: 'cooperate' | 'betray' | 'no_choice',
		opponentChoice: 'cooperate' | 'betray' | 'no_choice'
	) {
		if (playerChoice === 'no_choice' && opponentChoice === 'no_choice') {
			return {
				message: 'Both players did not make a choice. No points awarded.',
				playerPoints: 0,
				opponentPoints: 0
			};
		} else if (playerChoice === 'no_choice') {
			return {
				message: 'You did not make a choice. Opponent gains 1 point.',
				playerPoints: 0,
				opponentPoints: 1
			};
		} else if (opponentChoice === 'no_choice') {
			return {
				message: 'Your opponent did not make a choice. You gain 1 point.',
				playerPoints: 1,
				opponentPoints: 0
			};
		} else if (playerChoice === 'cooperate' && opponentChoice === 'cooperate') {
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

	async function handleChoice(choice: 'cooperate' | 'betray' | null) {
		if (
			!$currentGameSession ||
			playerChoice !== null ||
			gameState !== 'playing' ||
			!$currentPlayer
		) {
			gameLogger.error('Invalid game state or choice already made');
			return;
		}

		try {
			await makeChoice($currentGameSession.id, $currentPlayer.id, choice);
			gameLogger.info(`Choice made: ${choice}, waiting for opponent...`);
			// The UI will be updated automatically when the game session changes
		} catch (error) {
			gameLogger.error(`Error in handleChoice: ${error}`);
		}
	}

	async function fetchRoundHistory() {
		if ($currentPlayer && $currentPlayer.id) {
			const playerHistory = await getPlayerHistory($currentPlayer.id, 10);
			currentPlayer.update((player) =>
				player ? { ...player, roundHistory: playerHistory } : null
			);
		} else {
			console.warn(
				'Unable to fetch player round history: currentPlayer or currentPlayer.id is undefined'
			);
		}
		if ($opponent && $opponent.id) {
			const opponentHistory = await getPlayerHistory($opponent.id, 10);
			opponent.update((opp) => (opp ? { ...opp, roundHistory: opponentHistory } : null));
		} else {
			console.warn('Unable to fetch opponent round history: opponent or opponent.id is undefined');
		}
	}

	async function handleLeaveGame() {
		if ($currentPlayer) {
			await leaveGame($currentPlayer.id);
			currentPlayer.set(null);
			opponent.set(null);
			roundResult = '';
			if (unsubscribeFromSpecificGame) {
				unsubscribeFromSpecificGame();
				unsubscribeFromSpecificGame = null;
			}
			if (unsubscribeFromUserRoundHistory) {
				unsubscribeFromUserRoundHistory();
				unsubscribeFromUserRoundHistory = null;
			}
		}
	}

	$: console.log('Current player points:', $currentPlayer?.points);
	$: console.log('Opponent points:', $opponent?.points);
</script>

<div class="min-h-screen bg-white text-black p-4">
	<div class="container mx-auto max-w-3xl">
		<PlayersInQueue onlinePlayerCount={$playersInQueue} />

		<OpponentHistory player={$opponent} />

		<main>
			{#if !$currentPlayer}
				<JoinGameForm bind:playerName {handleJoin} {joinError} />
			{:else if gameState === 'waiting'}
				<WaitingForOpponent />
			{:else if gameState === 'playing'}
				<GamePlay
					opponent={$opponent}
					gameSession={$currentGameSession}
					{playerChoice}
					{handleChoice}
				>
					<TimerBar
						{totalTime}
						startTime={$currentGameSession?.created_at}
						on:timerEnd={handleTimerEnd}
					/>
				</GamePlay>
			{:else if gameState === 'result'}
				<RoundResult
					gameSession={$currentGameSession}
					{playerChoice}
					{opponentChoice}
					{roundResult}
				/>
			{:else if gameState === 'choosing'}
				<WaitingForOpponentChoice {playerChoice} />
			{/if}
		</main>

		<PlayerHistory player={$currentPlayer} />

		{#if $currentPlayer}
			<button
				on:click={handleLeaveGame}
				class="mt-4 bg-gray-500 text-white px-4 py-2 rounded font-semibold hover:bg-gray-600 transition duration-300"
			>
				Leave Game
			</button>
		{/if}
	</div>
</div>
