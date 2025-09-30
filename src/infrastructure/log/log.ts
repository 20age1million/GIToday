
export class Logger {
    public static log (type: string, message: string): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type.toUpperCase()}]: ${message}`);
    }

    public static warn (type: string, message: string): void {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [${type.toUpperCase()}] WARNING: ${message}`);
    }

    public static error (type: string, message: string): void {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [${type.toUpperCase()}] ERROR: ${message}`);
    }
}
