export interface Ability {
    name: string;
    value: number;
}

export interface Unit {
    id: string;
    emoji: string;
    name: string;
    attack: number;
    health: number;
    cost: number;
    level: number;
    abilities?: Ability[];
}

export interface Farmer extends Unit {
    wheat_generation: number;
}

export interface UnitData {
    emoji: string;
    name: string;
    attack: number;
    health: number;
    cost: number;
    level: number;
    abilities?: Ability[];
    level2?: Partial<UnitData>;
    level3?: Partial<UnitData>;
}
