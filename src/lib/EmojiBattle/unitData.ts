import type { UnitData } from './types';

export const unitData: Record<string, UnitData> = {
    Farmer: {
        emoji: '🧑‍🌾',
        name: 'Farmer',
        cost: 2,
        level_1: {
            name: 'Farmer',
            attack: 0,
            health: 1,
            abilities: [{ name: 'wheatGeneration', value: 1 }]
        },
        level_2: {
            name: 'Farmer',
            attack: 0,
            health: 2,
            abilities: [{ name: 'wheatGeneration', value: 2 }]
        },
        level_3: {
            name: 'Farmer',
            attack: 0,
            health: 3,
            abilities: [{ name: 'wheatGeneration', value: 3 }]
        }
    },
    Skirmisher: {
        emoji: '⚔️',
        name: 'Skirmisher',
        cost: 1,
        level_1: {
            name: 'Skirmisher',
            attack: 1,
            health: 1
        },
        level_2: {
            name: 'Skirmisher',
            attack: 3,
            health: 3
        },
        level_3: {
            name: 'Skirmisher',
            attack: 8,
            health: 8
        }
    },
    Swordsman: {
        emoji: '🗡️',
        name: 'Swordsman',
        cost: 2,
        level_1: {
            name: 'Swordsman',
            attack: 2,
            health: 2
        },
        level_2: {
            name: 'Swordsman',
            attack: 4,
            health: 6,
            abilities: [{ name: 'rage', value: 1 }]
        },
        level_3: {
            name: 'Swordsman',
            attack: 8,
            health: 16,
            abilities: [{ name: 'rage', value: 2 }]
        }
    },
    Brute: {
        emoji: '🏏',
        name: 'Brute',
        cost: 3,
        level_1: {
            name: 'Brute',
            attack: 3,
            health: 3
        },
        level_2: {
            name: 'Brute',
            attack: 7,
            health: 7,
            abilities: [{ name: 'weakening', value: 2 }]
        },
        level_3: {
            name: 'Brute',
            attack: 10,
            health: 9,
            abilities: [{ name: 'weakening', value: 3 }]
        }
    },
    Gunman: {
        emoji: '🔫',
        name: 'Gunman',
        cost: 1,
        level_1: {
            name: 'Gunman',
            attack: 2,
            health: 1
        },
        level_2: {
            name: 'Gunman',
            attack: 4,
            health: 4,
            abilities: [{ name: 'pierce', value: 1 }]
        },
        level_3: {
            name: 'Gunman',
            attack: 5,
            health: 5,
            abilities: [{ name: 'pierce', value: 1 }, { name: 'doubleTap', value: 2 }]
        }
    },
    Archer: {
        emoji: '🏹',
        name: 'Archer',
        cost: 2,
        level_1: {
            name: 'Archer',
            attack: 3,
            health: 1
        },
        level_2: {
            name: 'Archer',
            attack: 6,
            health: 2
        },
        level_3: {
            name: 'Archer',
            attack: 10,
            health: 3,
            abilities: [{ name: 'uberLongRange', value: 1 }]
        }
    },
    Catapult: {
        emoji: '🪨',
        name: 'Catapult',
        cost: 3,
        level_1: {
            name: 'Catapult',
            attack: 3,
            health: 3
        },
        level_2: {
            name: 'Catapult',
            attack: 5,
            health: 5
        },
        level_3: {
            name: 'Catapult',
            attack: 7,
            health: 7,
            abilities: [{ name: 'slow', value: 1 }, { name: 'playerDamage', value: 2 }]
        }
    },
    FireElemental: {
        emoji: '🔥',
        name: 'FireElemental',
        cost: 2,
        level_1: {
            name: 'FireElemental',
            attack: 2,
            health: 1
        },
        level_2: {
            name: 'FireElemental',
            attack: 3,
            health: 2,
            abilities: [{ name: 'burnSpread', value: 1 }]
        },
        level_3: {
            name: 'FireElemental',
            attack: 4,
            health: 3,
            abilities: [{ name: 'burnDuration', value: 2 }]
        }
    },
    IceElemental: {
        emoji: '❄️',
        name: 'IceElemental',
        cost: 2,
        level_1: {
            name: 'IceElemental',
            attack: 1,
            health: 2
        },
        level_2: {
            name: 'IceElemental',
            attack: 2,
            health: 3,
            abilities: [{ name: 'freeze', value: 1 }]
        },
        level_3: {
            name: 'IceElemental',
            attack: 3,
            health: 4,
            abilities: [{ name: 'freeze', value: 2 }]
        }
    },
    Wizard: {
        emoji: '🧙',
        name: 'Wizard',
        cost: 2,
        level_1: {
            name: 'Wizard',
            attack: 2,
            health: 2
        },
        level_2: {
            name: 'Wizard',
            attack: 4,
            health: 4,
            abilities: [{ name: 'allyBuff', value: 2 }]
        },
        level_3: {
            name: 'Wizard',
            attack: 10,
            health: 10,
            abilities: [{ name: 'allyBuff', value: 3 }]
        }
    },
    Rogue: {
        emoji: '🔪',
        name: 'Rogue',
        cost: 3,
        level_1: {
            name: 'Rogue',
            attack: 0,
            health: 1,
            abilities: [{ name: 'assassinate', value: 1 }, { name: 'rest', value: 2 }]
        },
        level_2: {
            name: 'Rogue',
            attack: 0,
            health: 1,
            abilities: [{ name: 'assassinate', value: 2 }, { name: 'rest', value: 2 }]
        },
        level_3: {
            name: 'Rogue',
            attack: 0,
            health: 1,
            abilities: [{ name: 'assassinate', value: 3 }, { name: 'rest', value: 2 }]
        }
    }
};