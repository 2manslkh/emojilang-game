import { supabase } from './client';
import type { Player } from './types';
import { matchmakingLogger } from '$lib/logging';

export async function findOpponent(playerId: string): Promise<{ gameId: string; opponent: Player | null } | null> {
    matchmakingLogger.info(`Finding opponent for player ${playerId}`);

    try {
        // Check if the player is already in the queue
        const { data: existingQueue, error: checkError } = await supabase
            .from('matchmaking_queue')
            .select('*')
            .eq('player_id', playerId);

        if (checkError) {
            matchmakingLogger.error(`Error checking existing queue: ${checkError.message}`);
            return null;
        }

        if (existingQueue.length === 0) {
            // Add player to matchmaking queue only if they're not already in it
            const { error: queueError } = await supabase
                .from('matchmaking_queue')
                .insert({ player_id: playerId });

            if (queueError) {
                matchmakingLogger.error(`Error adding player to matchmaking queue: ${queueError.message}`);
                return null;
            }
        } else {
            matchmakingLogger.info(`Player ${playerId} is already in the queue`);
        }

        const maxWaitTime = 30000; // 30 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const { data, error: matchError } = await supabase.rpc('find_match', { in_player_id: playerId });

                if (matchError) {
                    matchmakingLogger.error(`Error finding match: ${matchError.message}`);
                } else if (data && data.length > 0) {
                    const matchedPlayer = data[0];
                    if (matchedPlayer.id !== playerId) {
                        // Opponent found
                        matchmakingLogger.info(`Match found for player ${playerId}: Opponent ${matchedPlayer.id}`);
                        return { gameId: matchedPlayer.current_game_id, opponent: matchedPlayer };
                    } else {
                        // No opponent found yet
                        matchmakingLogger.info('No opponent found, continuing to wait');
                    }
                }
            } catch (error) {
                matchmakingLogger.error(`Error in find_match RPC: ${error}`);
            }

            // Wait before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Timeout reached, remove player from queue
        await supabase
            .from('matchmaking_queue')
            .delete()
            .eq('player_id', playerId);

        matchmakingLogger.info(`No match found for player ${playerId} within timeout`);
        return { gameId: '', opponent: null };
    } catch (error) {
        matchmakingLogger.error(`Unexpected error in findOpponent: ${error}`);
        return null;
    }
}

async function fetchOpponentData(gameId: string, opponentId: string | null): Promise<{ gameId: string; opponent: Player | null }> {
    if (!opponentId) {
        matchmakingLogger.error(`Invalid opponent ID: ${opponentId}`);
        return { gameId, opponent: null };
    }

    const { data: opponentData, error: opponentError } = await supabase
        .from('players')
        .select('*')
        .eq('id', opponentId)
        .single();

    if (opponentError) {
        matchmakingLogger.error(`Error fetching opponent data: ${opponentError.message}`);
        return { gameId, opponent: null };
    }

    matchmakingLogger.info(`Match found: Game ${gameId}, Opponent ${opponentId}`);
    return { gameId, opponent: opponentData as Player };
}

export async function removeFromMatchmaking(playerId: string) {
    const { error } = await supabase
        .from('players')
        .update({ in_game: false })
        .eq('id', playerId);

    if (error) {
        console.error('Error removing player from matchmaking:', error);
    }
}