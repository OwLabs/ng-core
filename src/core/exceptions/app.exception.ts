import { HttpStatus } from '@nestjs/common';

export class AppException extends Error {
  public readonly code: string;
  public readonly module: string; // This will store the exact Class Name
  public readonly statusCode: HttpStatus;

  constructor(
    message: string,
    code: string,
    context: string | object,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;

    if (typeof context === 'object' && context !== null) {
      this.module = context.constructor.name;
    } else {
      // Fallback in case they passed a string (e.g., Global functions without a class)
      this.module = context as string;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
