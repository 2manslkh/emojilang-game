import debug from 'debug';

const createLogger = (namespace: string) => {
    const log = debug(`EmojiBattle:${namespace}`);

    return {
        log: (message: string) => log(message),
        logData: (label: string, data: unknown) => {
            const structuredData = JSON.stringify(data, null, 2);
            log(`${label}:\n${structuredData}`);
        }
    };
};

export const gameLogger = createLogger('Game');
export const playerLogger = createLogger('Player');
export const battleLogger = createLogger('Battle');
export const aiLogger = createLogger('AI'); // New AI logger
