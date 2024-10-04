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
    created_at: string;
    updated_at: string;
}

export interface RoundHistory {
    id: string;
    player_id: string;
    choice: 'cooperate' | 'betray';
    created_at: string;
}
