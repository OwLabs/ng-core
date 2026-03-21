import { HttpStatus } from '@nestjs/common';
import { AppException } from 'src/core/exceptions/app.exception';
import { UserValidationErrorCodes } from './users-error.codes';

export class UserValidationException extends AppException {
  constructor(
    message: string,
    context: string | object,
    errorCode: UserValidationErrorCodes,
  ) {
    super(
      message,
      errorCode,
      context,
      UserValidationException.mapErrorCodeToStatus(errorCode),
    );
  }

  private static mapErrorCodeToStatus(
    errorCode: UserValidationErrorCodes,
  ): HttpStatus {
    switch (errorCode) {
      case UserValidationErrorCodes.EMAIL_NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case UserValidationErrorCodes.ACCOUNT_PROVIDER_MISMATCH:
        return HttpStatus.FORBIDDEN;
      case UserValidationErrorCodes.INCORRECT_PASSWORD:
        return HttpStatus.UNAUTHORIZED;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }
}
