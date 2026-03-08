import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  // Creating a logger with the specific 'HTTP' context
  private logger = new Logger('HTTP');
  private version = 'unknown';

  constructor() {
    try {
      const packageJsonPath = path.resolve(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      this.version = packageJson.version || 'unknown';
    } catch (e) {
      // Fallback if package.json cannot be read
    }
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, body, headers } = request;
    const requestTime = new Date().toISOString();
    const startTime = Date.now();

    // To capture the response body, we must intercept the res.send method
    const originalSend = response.send;
    let responseBody: any;

    response.send = function (body) {
      responseBody = body;
      return originalSend.apply(response, arguments as any);
    };

    // Hook into the response finish event to get the status code
    response.on('finish', () => {
      const { statusCode } = response;
      const processingTime = Date.now() - startTime;

      let parsedResponse = responseBody;
      try {
        if (typeof responseBody === 'string') {
          parsedResponse = JSON.parse(responseBody);
        }
      } catch (e) {
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

      // Log with proper severity level based on the HTTP status code
      if (statusCode >= 500) {
        this.logger.error(logBody);
      } else if (statusCode >= 400) {
        this.logger.warn(logBody);
      } else {
        this.logger.debug(logBody); // 'log' maps to 'info' in Winston
      }
    });

    next();
  }
}
