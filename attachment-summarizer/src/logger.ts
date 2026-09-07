/**
 * Winston-based structured logger. JSON output, supports per-request
 * child loggers via `.child({ requestId })`.
 */

import winston from "winston";
import { randomUUID } from "node:crypto";
import type { Logger as LoggerInterface } from "./types.js";

function createWinstonLogger(baseMeta: Record<string, unknown> = {}) {
  const level = process.env.LOG_LEVEL ?? "info";

  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: "attachment-summarizer", ...baseMeta },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
    ],
  });
}

const rootWinston = createWinstonLogger();

function buildLogger(
  winstonInstance: ReturnType<typeof createWinstonLogger>,
): LoggerInterface {
  return {
    info: (msg, meta) => {
      winstonInstance.info(msg, meta);
    },
    warn: (msg, meta) => {
      winstonInstance.warn(msg, meta);
    },
    error: (msg, meta) => {
      winstonInstance.error(msg, meta);
    },
    debug: (msg, meta) => {
      winstonInstance.debug(msg, meta);
    },
    child: (meta) => buildLogger(winstonInstance.child(meta)),
  };
}

export const logger: LoggerInterface = buildLogger(rootWinston);

/**
 * Create a fresh logger pre-bound to a requestId. Defaults to a
 * freshly generated UUID.
 */
export function createLogger(requestId: string = randomUUID()): LoggerInterface {
  return buildLogger(createWinstonLogger({ requestId }));
}

export type { LoggerInterface };