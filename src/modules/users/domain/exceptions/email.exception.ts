import { AppException } from 'src/core/exceptions/app.exception';
import { EmailValueObjectErrorCodes } from './users-error.codes';
import { HttpStatus } from '@nestjs/common';

export class EmailException extends AppException {
  constructor(message: string, context: string | object) {
    super(
      message,
      EmailValueObjectErrorCodes.INVALID_EMAIL,
      context,
      HttpStatus.BAD_REQUEST,
    );
  }
}
