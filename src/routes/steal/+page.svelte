<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		joinGame,
		leaveGame,
		makeChoice,
		getRoundHistory,
		currentPlayer,
		opponent
	} from '$lib/EmojiSteal/client';
	import { findOpponent, removeFromMatchmaking } from '$lib/EmojiSteal/matchmaking';
	import { TimerBar } from '$components/Timer';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import JoinGameForm from './JoinGameForm.svelte';
	import WaitingForOpponent from './WaitingForOpponent.svelte';
	import GamePlay from './GamePlay.svelte';
	import RoundResult from './RoundResult.svelte';
	import PlayerHistory from './PlayerHistory.svelte';
	import OpponentHistory from './OpponentHistory.svelte';
	import Header from './Header.svelte';
	import WaitingForOpponentChoice from './WaitingForOpponentChoice.svelte';

	import {
		initializeWatchers,
		unsubscribeAll,
		subscribeToSpecificGameSession,
		subscribeToUserRoundHistory,
		onlinePlayerCount,
		currentGameSession,
		roundHistory
	} from '$lib/EmojiSteal/watcher';
	import type { Player, GameSession, RoundHistory } from '$lib/EmojiSteal/types';
	import { playerLogger, gameLogger, matchmakingLogger, roundLogger } from '$lib/logging';

	let playerName = '';
	let joinError = '';
	let timeLeft = 15;
	let roundResult = '';

	let totalTime = 15;

	let startTime: number;
	let animationFrameId: number;

	let unsubscribeFromSpecificGame: (() => void) | null = null;
	let unsubscribeFromUserRoundHistory: (() => void) | null = null;

	$: playerRoundHistory = $currentPlayer?.roundHistory || [];
	$: opponentRoundHistory = $opponent?.roundHistory || [];

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
	): 'cooperate' | 'betray' | null {
		if (!session || !playerId) return null;
		return session.player1_id === playerId ? session.player1_choice : session.player2_choice;
	}

	function getOpponentChoice(
		session: GameSession | null,
		playerId: string | undefined
	): 'cooperate' | 'betray' | null {
		if (!session || !playerId) return null;
		return session.player1_id === playerId ? session.player2_choice : session.player1_choice;
	}

	onMount(() => {
		if ($currentPlayer) {
			initializeWatchers($currentPlayer.id);
		}
		return () => {
			unsubscribeAll();
			if ($currentPlayer) {
				leaveGame($currentPlayer.id);
			}
			endTimer();
		};
	});

	onDestroy(() => {
		if (unsubscribeFromSpecificGame) {
			unsubscribeFromSpecificGame();
		}
		if (unsubscribeFromUserRoundHistory) {
			unsubscribeFromUserRoundHistory();
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
				startMatchmaking();
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

		const result = await findOpponent($currentPlayer.id);
		if (!result) {
			matchmakingLogger.error('Failed to find or create a game');
			return;
		}

		matchmakingLogger.data('Matchmaking result', result);

		if (result.opponent) {
			matchmakingLogger.info(`Opponent found immediately: ${result.opponent.id}`);
			opponent.set(result.opponent);
			await fetchRoundHistory();
			startRound();
		} else {
			matchmakingLogger.info(`Waiting for opponent. Game ID: ${result.gameId}`);
		}

		if (unsubscribeFromSpecificGame) {
			unsubscribeFromSpecificGame();
		}
		unsubscribeFromSpecificGame = subscribeToSpecificGameSession(result.gameId);
		matchmakingLogger.info(`Subscribed to game session: ${result.gameId}`);
	}

	function handleGameSessionChange(session: GameSession | null) {
		if (!session) return;

		gameLogger.data('Game session updated', session);

		if (session.status === 'playing') {
			if (!$opponent) {
				const opponentId =
					session.player1_id === $currentPlayer?.id ? session.player2_id : session.player1_id;
				if (opponentId) {
					opponent.set({
						id: opponentId,
						name: 'Opponent',
						in_game: true,
						created_at: new Date().toISOString(),
						roundHistory: [],
						current_game_id: session.id
					});
					playerLogger.info(`Opponent set: ${opponentId}`);
				}
			}

			const playerChoice = getPlayerChoice(session, $currentPlayer?.id);
			if (playerChoice === null) {
				gameState = 'playing';
			} else {
				gameState = 'choosing';
			}
		} else if (session.status === 'finished') {
			gameState = 'result';
			endRound();
		}

		currentGameSession.set(session);
	}

	async function startRound() {
		timeLeft = totalTime;
		roundResult = '';
		startTime = performance.now();
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		updateTimer();
		await fetchRoundHistory();
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
		playerChoice: 'cooperate' | 'betray' | null,
		opponentChoice: 'cooperate' | 'betray' | null
	) {
		if (playerChoice === null && opponentChoice === null) {
			return {
				message: 'Both players did not make a choice. No points awarded.',
				playerPoints: 0,
				opponentPoints: 0
			};
		} else if (playerChoice === null) {
			return {
				message: 'You did not make a choice. Opponent gains 1 point.',
				playerPoints: 0,
				opponentPoints: 1
			};
		} else if (opponentChoice === null) {
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

	async function handleChoice(choice: 'cooperate' | 'betray') {
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
			await getRoundHistory($currentPlayer.id, 10);
			// The currentPlayer store will be automatically updated with the new round history
		} else {
			console.warn(
				'Unable to fetch player round history: currentPlayer or currentPlayer.id is undefined'
			);
		}
		if ($opponent && $opponent.id) {
			const opponentHistory = await getRoundHistory($opponent.id, 10);
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
</script>

<div class="min-h-screen bg-white text-black p-4">
	<div class="container mx-auto max-w-3xl">
		<Header onlinePlayerCount={$onlinePlayerCount} />

		<OpponentHistory player={$opponent!} />

		<main>
			{#if !$currentPlayer}
				<JoinGameForm bind:playerName {handleJoin} {joinError} />
			{:else if gameState === 'waiting'}
				<WaitingForOpponent />
			{:else if gameState === 'playing'}
				<GamePlay
					opponent={$opponent}
					gameSession={$currentGameSession}
					{timeLeft}
					{totalTime}
					{playerChoice}
					{handleChoice}
				/>
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

		<PlayerHistory player={$currentPlayer!} />

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
