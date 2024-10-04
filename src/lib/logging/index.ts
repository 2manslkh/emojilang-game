import debug from 'debug';

const createLogger = (namespace: string) => {
    const log = debug(`${namespace}`);

    return {
        info: (message: string) => log(`INFO: ${message}`),
        warn: (message: string) => log(`WARN: ${message}`),
        error: (message: string) => log(`ERROR: ${message}`),
        data: (label: string, data: unknown) => {
            const structuredData = JSON.stringify(data, null, 2);
            log(`DATA - ${label}:\n${structuredData}`);
        }
    };
};

export const gameLogger = createLogger('EmojiBattle:Game');
export const playerLogger = createLogger('EmojiBattle:Player');
export const battleLogger = createLogger('EmojiBattle:Battle');
export const aiLogger = createLogger('EmojiBattle:AI'); // New AI logger
export const emojistealLogger = createLogger('EmojiSteal:Game');
export const matchmakingLogger = createLogger('EmojiSteal:Matchmaking');
export const roundLogger = createLogger('EmojiSteal:Round');
export const dbLogger = createLogger('EmojiSteal:Database');