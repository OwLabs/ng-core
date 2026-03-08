import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { getMalaysiaTimestamp } from 'src/common/utils';

// Custom format to match: <Timestamp> <LEVEL> [<Context>] <Message>
const customFormat = winston.format.printf((info) => {
  const { level, context, message, ...meta } = info;
  const ctx = context ? `[${context}]` : '[App]';

  // If message is an object or array, stringify it
  let msg = typeof message === 'object' ? JSON.stringify(message) : message;

  // If there are additional metadata properties (like the JSON body from HTTP logs)
  // and they aren't part of the core symbol objects, stringify them.
  if (Object.keys(meta).length > 0) {
    // Strip out winston-internal symbols (SPLAT, level, etc.)
    const cleanMeta = Object.fromEntries(
      Object.entries(meta).filter(([key]) => typeof key === 'string'),
    );
    if (Object.keys(cleanMeta).length > 0) {
      msg = msg
        ? `${msg} ${JSON.stringify(cleanMeta)}`
        : JSON.stringify(cleanMeta);
    }
  }

  const timeStamp = getMalaysiaTimestamp();

  // Format: 2026-01-22T11:38:57+08:00 INFO [Context] Message
  return `${timeStamp} ${level.toUpperCase()} ${ctx} ${msg}`;
});

// Only allow logs where context is "HTTP"
const httpFilter = winston.format((info) => {
  return info.context === 'HTTP' ? info : false;
});

// Reject logs where context is "HTTP" (so app-events gets everything else)
const appEventFilter = winston.format((info) => {
  return info.context === 'HTTP' ? false : info;
});

export const winstonConfig = {
  transports: [
    // 1. Console for local development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike('ng-core', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),

    // 2. Application Events (INFO) level and strictly not HTTP context
    new winston.transports.File({
      filename: 'logs/application-events.log',
      level: 'info',
      format: winston.format.combine(appEventFilter(), customFormat),
    }),

    // 3. HTTP Traffic (DEBUG) level and strictly only HTTP context
    new winston.transports.File({
      filename: 'logs/http-traffic.log',
      level: 'debug',
      format: winston.format.combine(httpFilter(), customFormat),
    }),

    // 4. System Exceptions (Error)
    new winston.transports.File({
      filename: 'logs/system-exceptions.log',
      level: 'error',
      format: customFormat,
    }),
  ],
};
