/**
 * Frontend Logger - Compatibile con backend logger
 * Versione semplificata per il frontend senza dipendenze Node.js
 */

interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class FrontendLogger {
  private isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  error(message: string, meta?: any): void {
    const formatted = this.formatMessage('error', message, meta);
    console.error(formatted);
  }

  warn(message: string, meta?: any): void {
    const formatted = this.formatMessage('warn', message, meta);
    console.warn(formatted);
  }

  info(message: string, meta?: any): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('info', message, meta);
      console.info(formatted);
    }
  }

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, meta);
      console.debug(formatted);
    }
  }

  // Metodi compatibili con backend logger
  log(level: keyof LogLevel, message: string, meta?: any): void {
    switch (level) {
      case 'ERROR':
        this.error(message, meta);
        break;
      case 'WARN':
        this.warn(message, meta);
        break;
      case 'INFO':
        this.info(message, meta);
        break;
      case 'DEBUG':
        this.debug(message, meta);
        break;
      default:
        this.info(message, meta);
    }
  }
}

export const logger = new FrontendLogger();
export default logger;