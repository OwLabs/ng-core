import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

// ─── Constants ───────────────────────────────────────────────────────
const LOG_DIR = 'logs';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_FILES = 7; // 1 current + 6 backups

// ─── Malaysia Timestamp (platform-safe, works on Windows/Linux/Mac) ─
const malaysiaTimestamp = winston.format((info) => {
  info.timestamp = new Date()
    .toLocaleString('sv-SE', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(' ', 'T')
    .concat('+08:00');
  return info;
});

// ─── Context Filters ─────────────────────────────────────────────────
/** Only allow logs where context === 'HTTP' */
const httpFilter = winston.format((info) => {
  return info.context === 'HTTP' ? info : false;
});

/** Reject logs from HTTP and ErrorWorker — only normal app events */
const appEventFilter = winston.format((info) => {
  if (info.context === 'HTTP') return false;
  if (info.context === 'ErrorWorker') return false;
  return info;
});

/** Only allow logs from the ErrorWorker context (GlobalExceptionFilter events) */
const systemErrorFilter = winston.format((info) => {
  return info.context === 'ErrorWorker' ? info : false;
});

// ─── File Formats ────────────────────────────────────────────────────

/**
 * HTTP Traffic Format
 * Output: 2026-03-18T00:44:54+08:00 DEBUG [HTTP] {"body":{},"originalUrl":"/path",...}
 *
 * The message from HttpLoggerMiddleware is pre-stringified JSON.
 */
const httpFileFormat = winston.format.printf((info) => {
  const { level, message, timestamp, context } = info;
  const ctx = context ? `[${context}]` : '[HTTP]';
  return `${timestamp} ${level.toUpperCase()} ${ctx} ${message}`;
});

/**
 * Application Events Format
 * Output: 2026-03-18T00:44:54+08:00 INFO [DatabaseService] Connected to MongoDB: ng-core
 *
 * Simple human-readable log lines from services.
 */
const appEventFileFormat = winston.format.printf((info) => {
  const { level, message, timestamp, context } = info;
  const ctx = context ? `[${context}]` : '[App]';
  const msg = typeof message === 'object' ? JSON.stringify(message) : message;
  return `${timestamp} ${level.toUpperCase()} ${ctx} ${msg}`;
});

/**
 * System Exceptions Format
 * Output: 2026-03-18T00:44:54+08:00 ERROR [ErrorWorker] [AuthService] AUTH_4001 - Invalid credentials | POST /auth/login {"stackTrace":"Error: ..."}
 *
 * Human-readable prefix with structured JSON stack trace appended.
 */
const systemExceptionFileFormat = winston.format.printf((info) => {
  const { level, message, timestamp, context, stack } = info;
  const ctx = context ? `[${context}]` : '[System]';
  const msg = typeof message === 'object' ? JSON.stringify(message) : message;

  if (stack) {
    return `${timestamp} ${level.toUpperCase()} ${ctx} ${msg} ${JSON.stringify({ stackTrace: stack })}`;
  }

  return `${timestamp} ${level.toUpperCase()} ${ctx} ${msg}`;
});

// ─── Winston Configuration ───────────────────────────────────────────
export const winstonConfig = {
  transports: [
    // 1. Console — human-readable, colored (for local development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike('ng-core', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),

    // 2. Application Events — INFO level, excludes HTTP and ErrorWorker contexts
    //    Rolling rotation: 500 MB max, 7 files total (current + 6 backups)
    new winston.transports.File({
      filename: `${LOG_DIR}/application-events.log`,
      level: 'info',
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES,
      tailable: true,
      format: winston.format.combine(
        appEventFilter(),
        malaysiaTimestamp(),
        appEventFileFormat,
      ),
    }),

    // 3. HTTP Traffic — DEBUG level, strictly HTTP context only
    //    Rolling rotation: 500 MB max, 7 files total (current + 6 backups)
    new winston.transports.File({
      filename: `${LOG_DIR}/http-traffic.log`,
      level: 'debug',
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES,
      tailable: true,
      format: winston.format.combine(
        httpFilter(),
        malaysiaTimestamp(),
        httpFileFormat,
      ),
    }),

    // 4. System Exceptions — ERROR level, strictly ErrorWorker context only
    //    Rolling rotation: 500 MB max, 7 files total (current + 6 backups)
    new winston.transports.File({
      filename: `${LOG_DIR}/system-exceptions.log`,
      level: 'error',
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES,
      tailable: true,
      format: winston.format.combine(
        systemErrorFilter(),
        malaysiaTimestamp(),
        systemExceptionFileFormat,
      ),
    }),
  ],
};
