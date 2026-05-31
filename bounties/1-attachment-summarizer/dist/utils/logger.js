"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaString}`;
    }
    info(message, meta) {
        console.log(this.formatMessage(LogLevel.INFO, message, meta));
    }
    warn(message, meta) {
        console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
    error(message, error, meta) {
        let errMeta = meta || {};
        if (error instanceof Error) {
            errMeta = {
                ...errMeta,
                errorMessage: error.message,
                errorStack: error.stack
            };
        }
        else if (error) {
            errMeta = {
                ...errMeta,
                error: String(error)
            };
        }
        console.error(this.formatMessage(LogLevel.ERROR, message, errMeta));
    }
    debug(message, meta) {
        if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'DEBUG') {
            console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }
}
exports.logger = new Logger();
