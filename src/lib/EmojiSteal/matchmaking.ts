import { supabase } from './client';
import { matchmakingLogger } from '$lib/logging';

export async function joinQueue(playerId: string): Promise<void> {
    matchmakingLogger.info(`Player ${playerId} joining queue`);

    try {
        const { error } = await supabase.rpc('join_matchmaking_queue', { p_player_id: playerId });

        if (error) {
            matchmakingLogger.error(`Error joining matchmaking queue: ${error.message}`);
        } else {
            matchmakingLogger.info(`Player ${playerId} successfully joined the queue`);
        }
    } catch (error) {
        matchmakingLogger.error(`Unexpected error in joinQueue: ${error}`);
    }
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