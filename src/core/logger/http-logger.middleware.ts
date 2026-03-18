import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  // Using NestJS Logger with 'HTTP' context — routed through Winston automatically
  private logger = new Logger('HTTP');

  constructor(@Inject('APP_VERSION') private readonly version: string) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, body, headers } = request;
    const requestTime = new Date().toISOString();
    const startTime = Date.now();

    // Intercept response.send to capture the response body
    const originalSend = response.send;
    let responseBody: any;

    response.send = function (...args: any[]) {
      responseBody = args[0];
      return originalSend.apply(response, args as any);
    };

    // Hook into the response finish event to get the final status code
    response.on('finish', () => {
      const { statusCode } = response;
      const processingTime = Date.now() - startTime;

      let parsedResponse = responseBody;
      try {
        if (typeof responseBody === 'string') {
          parsedResponse = JSON.parse(responseBody);
        }
      } catch (_e) {
        // Ignore parse errors, keep as string
      }

      const logBody = {
        body: Object.keys(body || {}).length > 0 ? body : {},
        originalUrl,
        method,
        headers: { 'user-agent': headers['user-agent'] },
        requestTime,
        statusCode,
        response: parsedResponse,
        processingTime,
        version: this.version,
      };

      // Pre-stringify the log body so the file format receives a clean JSON string.
      // This avoids nest-winston's message destructuring quirk with object payloads.
      const jsonLine = JSON.stringify(logBody);

      // Log with proper severity level based on the HTTP status code
      if (statusCode >= 500) {
        this.logger.error(jsonLine);
      } else if (statusCode >= 400) {
        this.logger.warn(jsonLine);
      } else {
        this.logger.debug(jsonLine);
      }
    });

    next();
  }
}
