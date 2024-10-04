import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';
import type { Player, GameSession, RoundHistory } from './types';
import { playerLogger, gameLogger, matchmakingLogger, roundLogger, dbLogger } from '$lib/logging';

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

export interface Player {
    id: string;
    name: string;
    emoji: string;
    in_game: boolean;
    created_at: string;
}

export interface GameSession {
    id: string;
    player1_id: string;
    player2_id: string | null;
    player1_choice: 'cooperate' | 'betray' | null;
    player2_choice: 'cooperate' | 'betray' | null;
    status: 'waiting' | 'playing' | 'finished';
    round_result?: string;
    created_at: string;
    updated_at: string;
}

export function watchOnlinePlayers() {
    updateOnlinePlayers(); // Initial fetch

    const channel = supabase
        .channel('public:players')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'players' },
            (payload) => {
                console.log('Change received!', payload);
                updateOnlinePlayers();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

async function updateOnlinePlayers() {
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('in_game', true);

    if (error) {
        console.error('Error fetching online players:', error);
    } else {
        onlinePlayers.set(data);
    }
}

export async function joinGame(name: string): Promise<Player | null> {
    playerLogger.info(`Attempting to join game with name: ${name}`);

    try {
        const { data: existingPlayer, error: checkError } = await supabase
            .from('players')
            .select('*')
            .eq('name', name)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            dbLogger.error(`Error checking existing player: ${checkError.message}`);
            return null;
        }

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

            playerLogger.info(`Player '${name}' rejoined game successfully`);
            playerLogger.data('Updated player', updatedPlayer);
            return updatedPlayer as Player;
        } else {
            playerLogger.info(`Creating new player '${name}'`);
            const { data: newPlayer, error: insertError } = await supabase
                .from('players')
                .insert({ name, emoji: '😀', in_game: true })
                .select()
                .single();

            if (insertError) {
                dbLogger.error(`Error creating new player: ${insertError.message}`);
                return null;
            }

            playerLogger.info(`Player '${name}' joined game successfully`);
            playerLogger.data('New player', newPlayer);
            return newPlayer as Player;
        }
    } catch (error) {
        playerLogger.error(`Unexpected error during join game: ${error}`);
        return null;
    }
}

export async function makeChoice(gameId: string, playerId: string, choice: 'cooperate' | 'betray') {
    gameLogger.info(`Player ${playerId} making choice ${choice} in game ${gameId}`);

    const { data: game, error: fetchError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

    if (fetchError) {
        dbLogger.error(`Error fetching game session: ${fetchError.message}`);
        return;
    }

    const isPlayer1 = game.player1_id === playerId;

    const { error } = await supabase.rpc('make_choice_and_record_history', {
        p_game_id: gameId,
        p_player_id: playerId,
        p_choice: choice,
        p_is_player1: isPlayer1
    });

    if (error) {
        dbLogger.error(`Error making choice and recording history: ${error.message}`);
    } else {
        gameLogger.info(`Choice ${choice} recorded for player ${playerId} in game ${gameId}`);
    }
}

export async function endRoundAndKickInactivePlayer(gameId: string) {
    const { data, error } = await supabase.rpc('end_round_and_kick_inactive_player', {
        p_game_id: gameId
    });

    if (error) {
        console.error('Error ending round and kicking inactive player:', error);
        return null;
    }

    const updatedGame = data[0] as GameSession;
    currentGame.set(updatedGame);

    // If a player was kicked (didn't make a choice), remove them from matchmaking
    if (updatedGame.player1_choice === null && updatedGame.player1_id) {
        await removeFromMatchmaking(updatedGame.player1_id);
    }
    if (updatedGame.player2_choice === null && updatedGame.player2_id) {
        await removeFromMatchmaking(updatedGame.player2_id);
    }

    return updatedGame;
}

export async function waitForOpponentChoice(gameId: string): Promise<GameSession | null> {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.log('Timeout waiting for opponent choice');
            supabase.removeChannel(channel);
            resolve(null);
        }, 30000); // 30 seconds timeout

        const channel = supabase
            .channel(`game_${gameId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${gameId}` }, (payload) => {
                const updatedGame = payload.new as GameSession;
                if (updatedGame.player1_choice !== null && updatedGame.player2_choice !== null) {
                    clearTimeout(timeout);
                    supabase.removeChannel(channel);
                    resolve(updatedGame);
                }
            })
            .subscribe();
    });
}

export async function findOpponent(playerId: string): Promise<{ gameId: string; opponent: Player | null } | null> {
    matchmakingLogger.info(`Finding opponent for player ${playerId}`);

    try {
        const { data, error } = await supabase.rpc('find_or_create_game', { p_player_id: playerId });

        if (error) {
            dbLogger.error(`Error finding or creating game: ${error.message}`);
            return null;
        }

        const game = data[0] as GameSession;
        matchmakingLogger.data('RPC result', game);

        let opponent: Player | null = null;
        if (game.player2_id && game.player2_id !== playerId) {
            const { data: opponentData } = await supabase
                .from('players')
                .select('*')
                .eq('id', game.player2_id)
                .single();
            opponent = opponentData as Player;
        } else if (game.player1_id !== playerId) {
            const { data: opponentData } = await supabase
                .from('players')
                .select('*')
                .eq('id', game.player1_id)
                .single();
            opponent = opponentData as Player;
        }

        if (opponent) {
            matchmakingLogger.info(`Opponent found for player ${playerId}: ${opponent.id}`);
        } else {
            matchmakingLogger.info(`No immediate opponent found for player ${playerId}. Waiting in game ${game.id}`);
        }

        return { gameId: game.id, opponent };
    } catch (error) {
        matchmakingLogger.error(`Unexpected error in findOpponent: ${error}`);
        return null;
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

// Initial fetch of players
updateOnlinePlayers();

export function watchGameSessions(playerId: string) {
    console.log(`Starting to watch game sessions for player ${playerId}`);

    const channel = supabase
        .channel(`public:game_sessions:${playerId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game_sessions',
                filter: `player1_id=eq.${playerId} OR player2_id=eq.${playerId}`
            },
            async (payload) => {
                console.log('Game session change detected:', payload);
                const updatedGame = payload.new as GameSession;
                console.log('Updated game session:', updatedGame);

                if (updatedGame.status === 'playing' && updatedGame.player1_id && updatedGame.player2_id) {
                    console.log('Game session is now in playing state');
                    currentGame.set(updatedGame);
                    const opponentId = updatedGame.player1_id === playerId ? updatedGame.player2_id : updatedGame.player1_id;
                    console.log(`Fetching opponent (ID: ${opponentId}) details`);
                    const { data: opponent, error } = await supabase
                        .from('players')
                        .select('*')
                        .eq('id', opponentId)
                        .single();

                    if (error) {
                        console.error('Error fetching opponent details:', error);
                    } else if (opponent) {
                        console.log('Opponent found:', opponent);
                        // You might want to update a store or trigger a callback here
                    } else {
                        console.log('No opponent found');
                    }
                } else {
                    console.log('Game session updated, but not yet in playing state or missing player information');
                }
            }
        )
        .subscribe();

    console.log('Subscribed to game session changes');

    return () => {
        console.log('Unsubscribing from game session changes');
        supabase.removeChannel(channel);
    };
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

export async function getRoundHistory(playerId: string, limit: number = 10) {
    const { data, error } = await supabase
        .from('round_history')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false }) // Change to descending order
        .limit(limit);

    if (error) {
        console.error('Error fetching round history:', error);
        return [];
    }

    return data.reverse(); // Reverse the array to get oldest to newest
}

// Add this new function
export async function removeFromMatchmaking(playerId: string) {
    const { error } = await supabase
        .from('players')
        .update({ in_game: false })
        .eq('id', playerId);

    if (error) {
        console.error('Error removing player from matchmaking:', error);
    }
}