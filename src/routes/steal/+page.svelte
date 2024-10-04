<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		joinGame,
		leaveGame,
		findOpponent,
		makeChoice,
		getRoundHistory,
		removeFromMatchmaking
	} from '$lib/EmojiSteal/client';
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
		onlinePlayers,
		currentGameSession,
		roundHistory as watcherRoundHistory
	} from '$lib/EmojiSteal/watcher';
	import type { Player, GameSession, RoundHistory } from '$lib/EmojiSteal/types';
	import { playerLogger, gameLogger, matchmakingLogger, roundLogger } from '$lib/logging';

	let playerName = '';
	let currentPlayer: Player | null = null;
	let joinError = '';
	let opponent: Player | null = null;
	let timeLeft = 15;
	let roundResult = '';

	let totalTime = 15;

	let startTime: number;
	let animationFrameId: number;

	let unsubscribeFromSpecificGame: (() => void) | null = null;

	let playerRoundHistory: RoundHistory[] = [];
	let opponentRoundHistory: RoundHistory[] = [];

	$: onlinePlayerCount = $onlinePlayers.length;

	// Make gameState reactive based on currentGameSession
	$: gameState = getGameState($currentGameSession, currentPlayer?.id);

	// Derive playerChoice and opponentChoice from currentGameSession
	$: playerChoice = getPlayerChoice($currentGameSession, currentPlayer?.id);
	$: opponentChoice = getOpponentChoice($currentGameSession, currentPlayer?.id);

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
		initializeWatchers();
		return () => {
			unsubscribeAll();
			if (currentPlayer) {
				leaveGame(currentPlayer.id);
			}
			endTimer();
		};
	});

	onDestroy(() => {
		if (unsubscribeFromSpecificGame) {
			unsubscribeFromSpecificGame();
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
				currentPlayer = joinedPlayer;
				joinError = '';
				startMatchmaking();
			} else {
				playerLogger.warn('Failed to join game');
				joinError = 'Username already exists or an error occurred. Please try again.';
			}
		}
	}

	async function startMatchmaking() {
		if (!currentPlayer) {
			matchmakingLogger.error('No current player');
			return;
		}

		// Close the previous game subscription before starting a new game
		if (unsubscribeFromSpecificGame) {
			unsubscribeFromSpecificGame();
			unsubscribeFromSpecificGame = null;
		}

		const result = await findOpponent(currentPlayer.id);
		if (!result) {
			matchmakingLogger.error('Failed to find or create a game');
			return;
		}

		matchmakingLogger.data('Matchmaking result', result);

		if (result.opponent) {
			matchmakingLogger.info(`Opponent found immediately: ${result.opponent.id}`);
			opponent = result.opponent;
			await fetchRoundHistory();
			startRound();
		} else {
			matchmakingLogger.info(`Waiting for opponent. Game ID: ${result.gameId}`);
		}

		unsubscribeFromSpecificGame = subscribeToSpecificGameSession(result.gameId);
	}

	function handleGameSessionChange(session: GameSession | null) {
		if (!session) return;

		gameLogger.data('Game session updated', session);

		if (session.status === 'playing' && session.player1_id && session.player2_id) {
			if (!opponent) {
				opponent = {
					id: session.player1_id === currentPlayer?.id ? session.player2_id : session.player1_id,
					name: 'Opponent',
					emoji: '😊',
					in_game: true,
					created_at: new Date().toISOString()
				};
				playerLogger.info(`Opponent set: ${opponent.id}`);
			}
			startRound();
		}

		if (session.status === 'finished') {
			endRound();
		}
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
		if (!$currentGameSession || playerChoice !== null || gameState !== 'playing') {
			gameLogger.error('Invalid game state or choice already made');
			return;
		}

		try {
			await makeChoice($currentGameSession.id, currentPlayer!.id, choice);
			gameLogger.info(`Choice made: ${choice}, waiting for opponent...`);
		} catch (error) {
			gameLogger.error(`Error in handleChoice: ${error}`);
		}
	}

	async function fetchRoundHistory() {
		if (currentPlayer) {
			playerRoundHistory = await getRoundHistory(currentPlayer.id, 10);
		}
		if (opponent) {
			opponentRoundHistory = await getRoundHistory(opponent.id, 10);
		}
	}

	async function handleLeaveGame() {
		if (currentPlayer) {
			await leaveGame(currentPlayer.id);
			currentPlayer = null;
			opponent = null;
			roundResult = '';
			if (unsubscribeFromSpecificGame) {
				unsubscribeFromSpecificGame();
				unsubscribeFromSpecificGame = null;
			}
		}
	}
</script>

<div class="min-h-screen bg-white text-black p-4">
	<div class="container mx-auto max-w-3xl">
		<Header {onlinePlayerCount} />

		{#if currentPlayer && opponent}
			<OpponentHistory history={opponentRoundHistory} />
		{/if}

		<main>
			{#if !currentPlayer}
				<JoinGameForm bind:playerName {handleJoin} {joinError} />
			{:else if gameState === 'waiting'}
				<WaitingForOpponent />
			{:else if gameState === 'playing'}
				<GamePlay
					{opponent}
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

		{#if currentPlayer && opponent}
			<PlayerHistory history={playerRoundHistory} />
		{/if}

		{#if currentPlayer}
			<button
				on:click={handleLeaveGame}
				class="mt-4 bg-gray-500 text-white px-4 py-2 rounded font-semibold hover:bg-gray-600 transition duration-300"
			>
				Leave Game
			</button>
		{/if}
	</div>
</div>

<style>
	.loader {
		border: 5px solid #e5e5e5;
		border-top: 5px solid #333;
		border-radius: 50%;
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	:global(.animate-pulse) {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
