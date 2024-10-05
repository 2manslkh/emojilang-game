import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import type { Player, GameSession, RoundHistory } from './types';
import { emojistealLogger, playerLogger, dbLogger } from '$lib/logging';

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
function subscribeToCurrentPlayer(playerId: string) {
    playerLogger.info(`Subscribing to current player changes for player ${playerId}`);
    currentPlayerChannel = supabase
        .channel(`public:players:${playerId}`)
        .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${playerId}` },
            (payload) => {
                playerLogger.data('Current player change received', payload);
                handleCurrentPlayerUpdate(payload.new as Player);
            }
        )
        .subscribe();
}

// Add this function to handle current player updates
async function handleCurrentPlayerUpdate(player: Player) {
    if (player.current_game_id) {
        const { data: gameSession, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', player.current_game_id)
            .single();

        if (error) {
            dbLogger.error(`Error fetching game session: ${error.message}`);
        } else {
            currentGameSession.set(gameSession);
        }
    } else {
        currentGameSession.set(null);
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
        supabase.removeChannel(channel);
    };
}

export function unsubscribeAll() {
    emojistealLogger.info('Unsubscribing from all channels');
    if (matchmakingQueueChannel) supabase.removeChannel(matchmakingQueueChannel);
    if (currentPlayerChannel) supabase.removeChannel(currentPlayerChannel);
    if (gameSessionChannel) supabase.removeChannel(gameSessionChannel);
}
