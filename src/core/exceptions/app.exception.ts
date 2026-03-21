import { HttpStatus } from '@nestjs/common';

export class AppException extends Error {
  public readonly errorCode: string;
  public readonly module: string; // This will store the exact Class Name
  public readonly statusCode: HttpStatus;
  public readonly data?: Record<string, any>;

  constructor(
    message: string,
    errorCode: string,
    context: string | object,
    statusCode: HttpStatus,
    data: Record<string, any> = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.data = data;

    if (typeof context === 'string') {
      this.module = context;
    } else if (typeof context === 'function' && context.name) {
      // When `this` is passed from a static method, `context` is the constructor function itself
      this.module = context.name;
    } else if (typeof context === 'object' && context !== null) {
      this.module = context.constructor.name;
    } else {
      this.module = 'Unknown';
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
