import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { ErrorEventPayload } from '../exceptions/types';

@Injectable()
export class ErrorEventListener {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger,
  ) {}

  @OnEvent('system.error.occured', { async: true }) // Runs in background
  handleCriticalErrorEvent(payload: ErrorEventPayload) {
    this.logger.error(
      `[${payload.module}] ${payload.errorCode} - ${payload.message}`,
      {
        context: 'ErrorWorker',
        stackTrace: payload.stackTrace,
        path: payload.path,
        method: payload.method,
      },
    );
  }
}
