import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import type { Player, GameSession, RoundHistory } from './types';
import { emojistealLogger, playerLogger, dbLogger } from '$lib/logging';
import { getPlayerData } from './client';
import { opponent, currentPlayer } from './client';

export const playersInQueue = writable<number>(0);
export const currentGameSession = writable<GameSession | null>(null);
export const roundHistory = writable<RoundHistory[]>([]);

let matchmakingQueueChannel: RealtimeChannel;
let currentPlayerChannel: RealtimeChannel;
let gameSessionChannel: RealtimeChannel;

export function initializeWatchers(playerId: string) {
    emojistealLogger.info('Initializing watchers');
    subscribeToMatchmakingQueue();
    subscribeToCurrentPlayer(playerId);
    updatePlayersInQueue(); // Initial fetch
}

export function subscribeToMatchmakingQueue() {
    playerLogger.info('Subscribing to matchmaking queue changes');
    updatePlayersInQueue();
    matchmakingQueueChannel = supabase
        .channel('public:matchmaking_queue')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'matchmaking_queue' },
            (payload) => {
                playerLogger.data('Matchmaking queue change received', payload);
                updatePlayersInQueue();
            }
        )
        .subscribe();
}

async function updatePlayersInQueue() {
    playerLogger.info('Updating players in queue count');
    const { data, error } = await supabase.rpc('count_players_in_queue');

    if (error) {
        dbLogger.error(`Error fetching players in queue count: ${error.message}`);
    } else {
        playerLogger.data('Players in queue count updated', data);
        playersInQueue.set(data);
    }
}

// Add this function
export function subscribeToCurrentPlayer(playerId: string) {
    playerLogger.info(`Subscribing to current player changes for player ${playerId}`);
    const currentPlayerChannel = supabase
        .channel(`public:players:${playerId}`)
        .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${playerId}` },
            (payload) => {
                playerLogger.data('Current player change received', payload);
                handleCurrentPlayerUpdate(payload.new as Player);
            }
        )
        .subscribe();

    return () => {
        if (currentPlayerChannel) {
            supabase.removeChannel(currentPlayerChannel);
        }
    };
}

// Add this function to handle current player updates
async function handleCurrentPlayerUpdate(player: Player) {
    // Fetch the latest player data, including points
    const updatedPlayerData = await getPlayerData(player.id);

    if (updatedPlayerData) {
        currentPlayer.set(updatedPlayerData); // Always update the currentPlayer
        console.log('Updated current player:', updatedPlayerData);
    }

    // If player in current_game_id, fetch game session
    if (player.current_game_id) {
        const { data: gameSession, error: gameError } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', player.current_game_id)
            .single();

        if (gameError) {
            dbLogger.error(`Error fetching game session: ${gameError.message}`);
        } else {
            currentGameSession.set(gameSession);
            subscribeToSpecificGameSession(player.current_game_id);

            // Fetch opponent data
            const opponentId = gameSession.player1_id === player.id ? gameSession.player2_id : gameSession.player1_id;
            if (opponentId) {
                try {
                    const opponentData = await getPlayerData(opponentId);
                    if (opponentData) {
                        opponent.set(opponentData);
                        playerLogger.info(`Opponent set: ${opponentId}`);
                    } else {
                        playerLogger.error(`Failed to fetch opponent data for ID: ${opponentId}`);
                    }
                } catch (error) {
                    playerLogger.error(`Error fetching opponent data: ${error}`);
                }
            }
        }
    } else {
        currentGameSession.set(null);
        opponent.set(null);
        if (gameSessionChannel) {
            supabase.removeChannel(gameSessionChannel);
        }
    }
}

export function subscribeToSpecificGameSession(gameId: string) {
    emojistealLogger.info(`Subscribing to game session: ${gameId}`);
    if (gameSessionChannel) {
        supabase.removeChannel(gameSessionChannel);
    }

    gameSessionChannel = supabase
        .channel(`game_session:${gameId}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${gameId}` },
            (payload) => {
                emojistealLogger.data(`Game session change received for game ${gameId}`, payload);
                const updatedSession = payload.new as GameSession;
                currentGameSession.set(updatedSession);
                emojistealLogger.info(`Updated currentGameSession store with new data`);
            }
        )
        .subscribe();

    return () => {
        if (gameSessionChannel) {
            supabase.removeChannel(gameSessionChannel);
        }
    };
}

export function subscribeToUserRoundHistory(userId: string) {
    emojistealLogger.info(`Subscribing to round history for user: ${userId}`);
    const channel = supabase
        .channel(`user_round_history:${userId}`)
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'round_history', filter: `player_id=eq.${userId}` },
            (payload) => {
                emojistealLogger.data(`New round history entry for user ${userId}`, payload);
                roundHistory.update(history => [...history, payload.new as RoundHistory]);
            }
        )
        .subscribe();

    return () => {
        if (channel) {
            supabase.removeChannel(channel);
        }
    };
}

export function unsubscribeAll() {
    emojistealLogger.info('Unsubscribing from all channels');
    if (matchmakingQueueChannel) supabase.removeChannel(matchmakingQueueChannel);
    if (currentPlayerChannel) supabase.removeChannel(currentPlayerChannel);
    if (gameSessionChannel) supabase.removeChannel(gameSessionChannel);
}
