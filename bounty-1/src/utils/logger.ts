import winston from 'winston';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'attachment-summarizer' },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'development'
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                ({ timestamp, level, message, ...meta }) =>
                  `${timestamp} [${level}]: ${message} ${
                    Object.keys(meta).length > 1
                      ? JSON.stringify(meta, null, 2)
                      : ''
                  }`,
              ),
            )
          : winston.format.json(),
    }),
  ],
});

export function createChildLogger(component: string, meta?: Record<string, unknown>) {
  return logger.child({ component, ...meta });
}
