export interface Unit {
    emoji: string;
    name: string;
    attack: number;
    health: number;
    cost: number;
    ability?: string;
}

export interface Player {
    castle: { health: number };
    wheat: number;
    farmers: number;
    army: Unit[];
}