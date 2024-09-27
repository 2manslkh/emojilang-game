import { writable } from 'svelte/store';

export const gameSettings = {
    // Player settings
    INITIAL_PLAYER_HEALTH: 100,
    INITIAL_PLAYER_WHEAT: 10,
    INITIAL_FARMER_COUNT: 0,

    // Game phase settings
    PREPARATION_PHASE_DURATION: 10, // 10 seconds for preparation phase
    BATTLE_PHASE_DURATION: 2, // 2 seconds for battle phase
    BATTLE_DELAY: 1500, // 1.5 seconds delay between attacks

    // Wheat generation settings
    BASE_WHEAT_GENERATION: 2,

    // AI settings
    AI_INITIAL_SUMMONS: 3,

    // Combat settings
    DAMAGE_ANIMATION_DURATION: 2000, // 2 seconds for damage animation
};