import pino from "pino";
import { config } from "./config.js";

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: ["*.authorization", "*.token", "*.password", "*.credentials"],
    remove: true,
  },
});

