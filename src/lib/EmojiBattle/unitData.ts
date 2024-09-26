import type { UnitData } from './types';

export const unitData: Record<string, UnitData> = {
    Farmer: {
        emoji: '🧑‍🌾',
        name: 'Farmer',
        attack: 0,
        health: 1,
        cost: 2,
        level: 1,
        abilities: [{ name: 'wheatGeneration', value: 1 }],
        level2: { health: 2, abilities: [{ name: 'wheatGeneration', value: 2 }] },
        level3: { health: 3, abilities: [{ name: 'wheatGeneration', value: 3 }] },
    },
    Skirmisher: {
        emoji: '⚔️',
        name: 'Skirmisher',
        attack: 1,
        health: 1,
        cost: 1,
        level: 1,
        level2: { attack: 3, health: 3 },
        level3: { attack: 8, health: 8 },
    },
    Swordsman: {
        emoji: '🗡️',
        name: 'Swordsman',
        attack: 2,
        health: 2,
        cost: 2,
        level: 1,
        level2: { attack: 4, health: 6, abilities: [{ name: 'rage', value: 1 }] },
        level3: { attack: 8, health: 16, abilities: [{ name: 'rage', value: 2 }] },
    },
    Brute: {
        emoji: '🏏',
        name: 'Brute',
        attack: 3,
        health: 3,
        cost: 3,
        level: 1,
        level2: { attack: 7, health: 7, abilities: [{ name: 'weakening', value: 2 }] },
        level3: { attack: 10, health: 9, abilities: [{ name: 'weakening', value: 3 }] },
    },
    Gunman: {
        emoji: '🔫',
        name: 'Gunman',
        attack: 2,
        health: 1,
        cost: 1,
        level: 1,
        level2: { attack: 4, health: 4, abilities: [{ name: 'pierce', value: 1 }] },
        level3: { attack: 5, health: 5, abilities: [{ name: 'pierce', value: 1 }, { name: 'doubleTap', value: 2 }] },
    },
    Archer: {
        emoji: '🏹',
        name: 'Archer',
        attack: 3,
        health: 1,
        cost: 2,
        level: 1,
        level2: { attack: 6, health: 2 },
        level3: { attack: 10, health: 3, abilities: [{ name: 'uberLongRange', value: 1 }] },
    },
    Catapult: {
        emoji: '🪨',
        name: 'Catapult',
        attack: 3,
        health: 3,
        cost: 3,
        level: 1,
        abilities: [{ name: 'slow', value: 1 }, { name: 'splash', value: 1 }],
        level2: { attack: 5, health: 5 },
        level3: { attack: 7, health: 7, abilities: [{ name: 'slow', value: 1 }, { name: 'playerDamage', value: 2 }] },
    },
    FireElemental: {
        emoji: '🔥',
        name: 'Fire Elemental',
        attack: 2,
        health: 1,
        cost: 2,
        level: 1,
        level2: { attack: 3, health: 2, abilities: [{ name: 'burnSpread', value: 1 }] },
        level3: { attack: 4, health: 3, abilities: [{ name: 'burnDuration', value: 2 }] },
    },
    IceElemental: {
        emoji: '❄️',
        name: 'Ice Elemental',
        attack: 1,
        health: 2,
        cost: 2,
        level: 1,
        level2: { attack: 2, health: 3, abilities: [{ name: 'freeze', value: 1 }] },
        level3: { attack: 3, health: 4, abilities: [{ name: 'freeze', value: 2 }] },
    },
    Wizard: {
        emoji: '🧙',
        name: 'Wizard',
        attack: 2,
        health: 2,
        cost: 2,
        level: 1,
        abilities: [{ name: 'allyBuff', value: 1 }],
        level2: { attack: 4, health: 4, abilities: [{ name: 'allyBuff', value: 2 }] },
        level3: { attack: 10, health: 10, abilities: [{ name: 'allyBuff', value: 3 }] },
    },
    Rogue: {
        emoji: '🔪',
        name: 'Rogue',
        attack: 0,
        health: 1,
        cost: 3,
        level: 1,
        abilities: [{ name: 'assassinate', value: 1 }, { name: 'rest', value: 2 }],
        level2: { abilities: [{ name: 'assassinate', value: 2 }, { name: 'rest', value: 2 }] },
        level3: { abilities: [{ name: 'assassinate', value: 3 }, { name: 'rest', value: 2 }] },
    },
};