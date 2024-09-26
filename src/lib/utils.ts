import debug from 'debug';

/**
 * Creates a debug logger with a specific namespace and provides a method to log structured data.
 * @param namespace The debug namespace to use for the logger.
 * @returns An object with a logData method for logging structured data.
 */
export function createStructuredLogger(namespace: string) {
    const log = debug(namespace);

    return {
        /**
         * Logs structured data with a label.
         * @param label A label for the data being logged.
         * @param data The data to be logged.
         */
        logData: (label: string, data: unknown) => {
            const structuredData = JSON.stringify(data, null, 2);
            log(`${label}:\n${structuredData}`);
        }
    };
}