export interface Player {
    id: string;
    name: string;
    in_game: boolean;
    created_at: string;
    current_game_id: string | null;
    roundHistory: RoundHistory[];
    points: number;
}

export interface GameSession {
    id: string;
    player1_id: string;
    player2_id: string | null;
    player1_choice: 'cooperate' | 'betray' | 'no_choice';
    player2_choice: 'cooperate' | 'betray' | 'no_choice';
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

export type Choice = 'cooperate' | 'betray' | 'no_choice' | null;

export enum ChoiceEnum {
    Cooperate = 'cooperate',
    Betray = 'betray',
    NoChoice = 'no_choice'
}

export function getChoiceEmoji(choice: Choice) {
    switch (choice) {
        case ChoiceEnum.Cooperate:
            return '🤝';
        case ChoiceEnum.Betray:
            return '🔪';
        case ChoiceEnum.NoChoice:
            return '❓';
        default:
            return '';
    }
}

export function getChoiceColor(choice: Choice) {
    switch (choice) {
        case ChoiceEnum.Cooperate:
            return 'bg-green-200 text-green-800';
        case ChoiceEnum.Betray:
            return 'bg-red-200 text-red-800';
        case ChoiceEnum.NoChoice:
            return 'bg-gray-200 text-gray-800';
        default:
            return '';
    }
}