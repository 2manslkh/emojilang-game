import { supabase } from './client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import type { Player, GameSession, RoundHistory } from './types';
import { emojistealLogger, playerLogger, dbLogger, matchmakingLogger } from '$lib/logging';

export const onlinePlayers = writable<Player[]>([]);
export const currentGameSession = writable<GameSession | null>(null);
export const roundHistory = writable<RoundHistory[]>([]);

let playersChannel: RealtimeChannel;
let gameSessionChannel: RealtimeChannel;
let roundHistoryChannel: RealtimeChannel;
let specificGameSessionChannel: RealtimeChannel;

export function initializeWatchers() {
    emojistealLogger.info('Initializing watchers');
    subscribeToPlayers();
    subscribeToGameSessions();
    subscribeToRoundHistory();
}

function subscribeToPlayers() {
    playerLogger.info('Subscribing to player changes');
    playersChannel = supabase
        .channel('public:players')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'players' },
            (payload) => {
                playerLogger.data('Players change received', payload);
                updateOnlinePlayers();
            }
        )
        .subscribe();
}

function subscribeToGameSessions() {
    emojistealLogger.info('Subscribing to game session changes');
    gameSessionChannel = supabase
        .channel('public:game_sessions')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'game_sessions' },
            (payload) => {
                emojistealLogger.data('Game session change received', payload);
                updateCurrentGameSession(payload.new as GameSession);
            }
        )
        .subscribe();
}

function subscribeToRoundHistory() {
    emojistealLogger.info('Subscribing to round history changes');
    roundHistoryChannel = supabase
        .channel('public:round_history')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'round_history' },
            (payload) => {
                emojistealLogger.data('Round history change received', payload);
                updateRoundHistory();
            }
        )
        .subscribe();
}

export function subscribeToSpecificGameSession(gameId: string) {
    emojistealLogger.info(`Subscribing to specific game session: ${gameId}`);
    if (specificGameSessionChannel) {
        supabase.removeChannel(specificGameSessionChannel);
    }

    specificGameSessionChannel = supabase
        .channel(`game_session:${gameId}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${gameId}` },
            (payload) => {
                emojistealLogger.data(`Specific game session change received for game ${gameId}`, payload);
                updateCurrentGameSession(payload.new as GameSession);
            }
        )
        .subscribe();

    return () => {
        if (specificGameSessionChannel) {
            emojistealLogger.info(`Unsubscribing from specific game session: ${gameId}`);
            supabase.removeChannel(specificGameSessionChannel);
        }
    };
}

async function updateOnlinePlayers() {
    playerLogger.info('Updating online players');
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('in_game', true);

    if (error) {
        dbLogger.error(`Error fetching online players: ${error.message}`);
    } else {
        playerLogger.data('Online players updated', data);
        onlinePlayers.set(data as Player[]);
    }
}

function updateCurrentGameSession(newGameSession: GameSession) {
    emojistealLogger.info(`Updating current game session: ${newGameSession.id}`);
    emojistealLogger.data('New game session state', newGameSession);
    currentGameSession.set(newGameSession);
}

async function updateRoundHistory() {
    emojistealLogger.info('Updating round history');
    const { data, error } = await supabase
        .from('round_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        dbLogger.error(`Error fetching round history: ${error.message}`);
    } else {
        emojistealLogger.data('Round history updated', data);
        roundHistory.set(data as RoundHistory[]);
    }
}

export function unsubscribeAll() {
    emojistealLogger.info('Unsubscribing from all channels');
    if (playersChannel) supabase.removeChannel(playersChannel);
    if (gameSessionChannel) supabase.removeChannel(gameSessionChannel);
    if (roundHistoryChannel) supabase.removeChannel(roundHistoryChannel);
    if (specificGameSessionChannel) supabase.removeChannel(specificGameSessionChannel);
}
