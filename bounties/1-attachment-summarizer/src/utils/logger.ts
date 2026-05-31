export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  public info(message: string, meta?: any): void {
    console.log(this.formatMessage(LogLevel.INFO, message, meta));
  }

  public warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  public error(message: string, error?: Error | unknown, meta?: any): void {
    let errMeta = meta || {};
    if (error instanceof Error) {
      errMeta = {
        ...errMeta,
        errorMessage: error.message,
        errorStack: error.stack
      };
    } else if (error) {
      errMeta = {
        ...errMeta,
        error: String(error)
      };
    }
    console.error(this.formatMessage(LogLevel.ERROR, message, errMeta));
  }

  public debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'DEBUG') {
      console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();
