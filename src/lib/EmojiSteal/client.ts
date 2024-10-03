import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

export { supabase };

export const players = writable<Player[]>([]);
export const currentGame = writable<GameSession | null>(null);

export interface Player {
    id: string;
    name: string;
    emoji: string;
    in_game: boolean;
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

export function watchPlayers() {
    updatePlayers(); // Initial fetch

    const channel = supabase
        .channel('public:players')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'players' },
            (payload) => {
                console.log('Change received!', payload);
                updatePlayers();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

async function updatePlayers() {
    const { data, error } = await supabase
        .from('players')
        .select('*');

    if (error) {
        console.error('Error fetching players:', error);
    } else {
        players.set(data);
    }
}

export async function joinGame(name: string) {
    console.log(`Attempting to join game with name: ${name}`);

    try {
        // Check if the player already exists
        const { data: existingPlayer, error: checkError } = await supabase
            .from('players')
            .select('*')
            .eq('name', name)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing player:', checkError);
            return null;
        }

        if (existingPlayer) {
            console.log(`Player '${name}' already exists, updating status`);
            // Player exists, update their status
            const { data: updatedPlayer, error: updateError } = await supabase
                .from('players')
                .update({ in_game: true })
                .eq('id', existingPlayer.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating player status:', updateError);
                return null;
            }

            console.log(`Player '${name}' rejoined game successfully:`, updatedPlayer);
            return updatedPlayer;
        } else {
            console.log(`Creating new player '${name}'`);
            // Player doesn't exist, create a new one
            const { data: newPlayer, error: insertError } = await supabase
                .from('players')
                .insert({ name, emoji: '😀', in_game: true })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating new player:', insertError);
                return null;
            }

            console.log(`Player '${name}' joined game successfully:`, newPlayer);
            return newPlayer;
        }
    } catch (error) {
        console.error('Unexpected error during join game:', error);
        return null;
    }
}

export async function makeChoice(gameId: string, playerId: string, choice: 'cooperate' | 'betray') {
    const { data: game, error: fetchError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

    if (fetchError) {
        console.error('Error fetching game session:', fetchError);
        return null;
    }

    const isPlayer1 = game.player1_id === playerId;

    // Start a transaction
    const { data, error } = await supabase.rpc('make_choice_and_record_history', {
        p_game_id: gameId,
        p_player_id: playerId,
        p_choice: choice,
        p_is_player1: isPlayer1
    });

    if (error) {
        console.error('Error making choice and recording history:', error);
        return null;
    }

    const updatedGame = data[0] as GameSession;
    currentGame.set(updatedGame);
    console.log('Updated game after choice:', updatedGame);
    return updatedGame;
}

export async function waitForOpponentChoice(gameId: string) {
    const { data: currentGame, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', gameId)
        .single();

    if (error) {
        console.error('Error fetching current game state:', error);
        return null;
    }

    if (currentGame.player1_choice !== null && currentGame.player2_choice !== null) {
        return currentGame as GameSession;
    }

    return new Promise<GameSession>((resolve) => {
        const channel = supabase
            .channel(`game_${gameId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${gameId}` }, (payload) => {
                const updatedGame = payload.new as GameSession;
                if (updatedGame.player1_choice !== null && updatedGame.player2_choice !== null) {
                    supabase.removeChannel(channel);
                    resolve(updatedGame);
                }
            })
            .subscribe();
    });
}

export async function findOpponent(playerId: string): Promise<{ opponent: Player | null; unsubscribe: () => void } | null> {
    // First, check if there's an existing game session where this player can join as player2
    const { data: existingGames, error: existingGameError } = await supabase
        .from('game_sessions')
        .select('*')
        .is('player2_id', null)
        .eq('status', 'waiting')
        .neq('player1_id', playerId);

    if (existingGameError) {
        console.error('Error checking existing games:', existingGameError);
        return null;
    }

    if (existingGames && existingGames.length > 0) {
        const existingGame = existingGames[0];
        // If there's an existing game, join as player2 and update the game status
        const { data: updatedGame, error: updateError } = await supabase
            .rpc('update_game_session', {
                game_session_id: existingGame.id,
                new_player2_id: playerId
            })
            .single();

        if (updateError) {
            console.error('Error updating game session:', updateError);
            return null;
        }

        if (!updatedGame) {
            console.error('Failed to update game session');
            return null;
        }

        // Type assertion for updatedGame
        const typedUpdatedGame = updatedGame as GameSession;

        // Update both players' in_game status
        await supabase
            .from('players')
            .update({ in_game: true })
            .in('id', [playerId, typedUpdatedGame.player1_id]);

        const { data: opponent } = await supabase
            .from('players')
            .select('*')
            .eq('id', typedUpdatedGame.player1_id)
            .single();

        currentGame.set(typedUpdatedGame);
        return { opponent: opponent as Player, unsubscribe: () => { } };
    }

    // If no existing game to join, create a new waiting game session
    const { data: gameSession, error: gameError } = await supabase
        .from('game_sessions')
        .insert({
            player1_id: playerId,
            player2_id: null,
            status: 'waiting',
            player1_choice: null,
            player2_choice: null
        })
        .select()
        .single();

    if (gameError) {
        console.error('Error creating waiting game session:', gameError);
        return null;
    }

    // Update player's in_game status
    await supabase
        .from('players')
        .update({ in_game: true })
        .eq('id', playerId);

    currentGame.set(gameSession);

    // Watch for updates on this specific game session
    const unsubscribe = watchSpecificGameSession(gameSession.id, playerId);

    // Return an object with the unsubscribe function and null for the opponent
    return { opponent: null, unsubscribe };
}

function watchSpecificGameSession(gameSessionId: string, playerId: string) {
    const channel = supabase
        .channel(`public:game_sessions:${gameSessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_sessions',
                filter: `id=eq.${gameSessionId}`
            },
            async (payload) => {
                console.log('Specific game session updated:', payload);
                const updatedGame = payload.new as GameSession;
                if (updatedGame.status === 'playing' && updatedGame.player2_id) {
                    currentGame.set(updatedGame);
                    const opponentId = updatedGame.player1_id === playerId ? updatedGame.player2_id : updatedGame.player1_id;
                    const { data: opponent } = await supabase
                        .from('players')
                        .select('*')
                        .eq('id', opponentId)
                        .single();

                    if (opponent) {
                        // Notify the application that an opponent has joined
                        // You might want to use a custom event or a store for this
                        console.log('Opponent joined:', opponent);
                    }
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
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
updatePlayers();

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