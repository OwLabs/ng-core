import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppException } from './app.exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErrorEventPayload } from './types';
import { getMalaysiaTimestamp } from 'src/common/utils';

@Catch() // Catch everything
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isAppException = exception instanceof AppException;
    const isHttpException = exception instanceof HttpException;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'SYS_5000_UNKNOWN';
    let module = 'System';
    let message = 'Internal server error';

    if (isAppException) {
      status = exception.statusCode;
      errorCode = exception.errorCode;
      module = exception.module; // This is now EXACTLY the class name (e.g. 'User', 'GetUserByIdHandler')
      message = exception.message;
    } else if (isHttpException) {
      status = exception.getStatus();
      message = exception.message;
      errorCode = `HTTP_${status}`;
    }

    const errorPayload: ErrorEventPayload = {
      errorCode: errorCode,
      module: module,
      message: message,
      stackTrace: exception.stack || '',
      path: request.url,
      method: request.method,
      body: request.body,
      timestamp: getMalaysiaTimestamp(),
    };

    this.eventEmitter.emit('system.error.occurred', errorPayload);

    // Send generic response to user
    response.status(status).json({
      success: false,
      errorCode: errorCode,
      message: message,
      timestamp: errorPayload.timestamp,
      ...(isAppException && exception.data ? { data: exception.data } : {}),
    });
  }
}
