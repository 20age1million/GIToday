import chalk from "chalk";

export class Logger {
    private static formatTime(): string {
        // 用本地格式 + 时分秒 + 毫秒
        const now = new Date();
        // 例如 “2025-10-12 14:23:45.123”
        const datePart = now.toLocaleDateString();  // 本地日期
        const timePart = now.toLocaleTimeString('en-US', { hour12: false });
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        return `${datePart} ${timePart}.${ms}`;
    }

    public static log (type: string, message: string): void {
        const timestamp = Logger.formatTime();
        console.log(`[${timestamp}] [${type.toUpperCase()}]: ${message}`);
    }

    public static warn (type: string, message: string): void {
        const timestamp = Logger.formatTime();
        console.warn(chalk.yellow(`[${timestamp}] [${type.toUpperCase()}] WARNING: ${message}`));
    }

    public static error (type: string, message: string): void {
        const timestamp = Logger.formatTime();
        console.error(chalk.red(`[${timestamp}] [${type.toUpperCase()}] ERROR: ${message}`));
    }

    public static debug (message: string): void {
        console.debug(chalk.blue(`[DEBUG]: ${message}`));
    }
}
