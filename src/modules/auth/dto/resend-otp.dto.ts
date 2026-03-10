import { IsMongoId } from 'class-validator';

export class resendOtpDto {
  @IsMongoId()
  otpTokenId: string;
}
