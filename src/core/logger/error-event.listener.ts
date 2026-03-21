import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ErrorEventPayload } from '../exceptions/types';

@Injectable()
export class ErrorEventListener {
  private readonly logger = new Logger('ErrorWorker');

  @OnEvent('system.error.occurred', { async: true }) // Runs in background
  handleCriticalErrorEvent(payload: ErrorEventPayload) {
    // Message includes module, error code, description, method, and path
    // Stack trace is passed as second arg → Winston receives it as info.stack
    this.logger.error(
      `[${payload.module}] ${payload.errorCode} - ${payload.message} | ${payload.method} ${payload.path}`,
      payload.stackTrace,
    );
  }
}
