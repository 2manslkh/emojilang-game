import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import type { Player, GameSession, RoundHistory } from './types';
import { playerLogger, emojistealLogger, dbLogger } from '$lib/logging';
import { initializeWatchers } from './watcher';

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

export { supabase };

export const onlinePlayers = writable<Player[]>([]);
export const currentGame = writable<GameSession | null>(null);
export const opponent = writable<Player | null>(null);
export const currentPlayer = writable<Player | null>(null);

async function checkIfExistingPlayer(name: string): Promise<Player | null> {
    try {
        const { data: existingPlayer, error } = await supabase
            .from('players')
            .select()
            .eq('name', name)
            .maybeSingle();

        if (error) throw error;

        return existingPlayer;
    } catch (error) {
        dbLogger.error(`Error checking existing player: ${error}`);
        return null;
    }
}

export async function joinGame(name: string): Promise<Player | null> {
    playerLogger.info(`Attempting to join game with name: ${name}`);

    try {
        const existingPlayer = await checkIfExistingPlayer(name);

        if (existingPlayer) {
            playerLogger.info(`Player '${name}' already exists, updating status`);
            const { data: updatedPlayer, error: updateError } = await supabase
                .from('players')
                .update({ in_game: true })
                .eq('id', existingPlayer.id)
                .select()
                .single();

            if (updateError) {
                dbLogger.error(`Error updating player status: ${updateError.message}`);
                return null;
            }

            const roundHistory = await getPlayerHistory(existingPlayer.id);
            const updatedPlayerWithHistory = { ...updatedPlayer, roundHistory };
            currentPlayer.set(updatedPlayerWithHistory);
            playerLogger.info(`Player '${name}' rejoined game successfully`);
            playerLogger.data('Updated player', updatedPlayerWithHistory);
            initializeWatchers(existingPlayer.id);
            return updatedPlayerWithHistory;
        } else {
            playerLogger.info(`Creating new player '${name}'`);
            const { data: newPlayer, error: insertError } = await supabase
                .from('players')
                .insert({ name, in_game: true })
                .select()
                .single();

            if (insertError) {
                dbLogger.error(`Error creating new player: ${insertError.message}`);
                return null;
            }

            const roundHistory: RoundHistory[] = [];
            const newPlayerWithHistory = { ...newPlayer, roundHistory };
            currentPlayer.set(newPlayerWithHistory);
            playerLogger.info(`Player '${name}' joined game successfully`);
            playerLogger.data('New player', newPlayerWithHistory);
            initializeWatchers(newPlayer.id);
            return newPlayerWithHistory;
        }
    } catch (error) {
        playerLogger.error(`Unexpected error during join game: ${error}`);
        return null;
    }
}

export async function makeChoice(gameId: string, playerId: string, choice: 'cooperate' | 'betray' | null) {
    emojistealLogger.info(`Player ${playerId} making choice ${choice} in game ${gameId}`);

    const { data, error } = await supabase.rpc('make_choice', {
        p_game_id: gameId,
        p_player_id: playerId,
        p_choice: choice
    });

    if (error) {
        dbLogger.error(`Error making choice: ${error.message}`);
        throw error;
    } else {
        emojistealLogger.info(`Choice ${choice} recorded for player ${playerId} in game ${gameId}`);
        return data;
    }
}


export async function endGame(gameId: string) {
    const { error } = await supabase
        .from('game_sessions')
        .update({ status: 'finished' })
        .eq('id', gameId);

    if (error) {
        console.error('Error ending game:', error);
    } else {
        console.log('Game ended successfully');
        currentGame.set(null);
    }

    // Update players' in_game status
    const { data: game } = await supabase
        .from('game_sessions')
        .select('player1_id, player2_id')
        .eq('id', gameId)
        .single();

    if (game) {
        await supabase
            .from('players')
            .update({ in_game: false })
            .in('id', [game.player1_id, game.player2_id]);
    }
}

export async function leaveGame(playerId: string) {
    // Remove player from matchmaking queue if present
    await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('player_id', playerId);

    // Update the player's status
    const { error: updateError } = await supabase
        .from('players')
        .update({ in_game: false })
        .eq('id', playerId);

    if (updateError) {
        console.error('Error updating player status:', updateError);
        return;
    }

    // Then, find and update any active game sessions
    const { data: activeSessions, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .in('status', ['waiting', 'playing']);

    if (sessionError) {
        console.error('Error finding active game sessions:', sessionError);
        return;
    }

    for (const session of activeSessions) {
        if (session.status === 'waiting') {
            // If it's a waiting session, just delete it
            await supabase
                .from('game_sessions')
                .delete()
                .eq('id', session.id);
        } else if (session.status === 'playing') {
            // If it's a playing session, end the game
            await supabase
                .from('game_sessions')
                .update({ status: 'finished' })
                .eq('id', session.id);

            // Update the other player's status
            const otherPlayerId = session.player1_id === playerId ? session.player2_id : session.player1_id;
            await supabase
                .from('players')
                .update({ in_game: false })
                .eq('id', otherPlayerId);
        }
    }

    console.log('Left game successfully');
    currentGame.set(null);
}

export async function getFinalGameState(gameId: string): Promise<GameSession | null> {
    const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

    if (error) {
        console.error('Error fetching final game state:', error);
        return null;
    }

    return data as GameSession;
}

export async function getPlayerData(playerId: string): Promise<Player | null> {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .single();

        if (error) throw error;

        if (data) {
            const roundHistory = await getPlayerHistory(playerId);
            const playerData = { ...data, roundHistory };
            return playerData;
        }

        return null;
    } catch (error) {
        console.error(`Error fetching player data: ${error}`);
        return null;
    }
}

export async function getPlayerHistory(playerId: string, limit: number = 10): Promise<RoundHistory[]> {
    if (!playerId) {
        console.warn('getPlayerHistory called with undefined playerId');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('player_history')
            .select('*')
            .eq('player_id', playerId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        const history = data.reverse(); // Reverse the array to get oldest to newest
        return history;
    } catch (error) {
        console.error('Error fetching player history:', error);
        return [];
    }
}

export async function getCurrentGameSession(gameId: string): Promise<GameSession | null> {
    try {
        const { data, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('id', gameId)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error fetching current game session:', error);
        return null;
    }
}