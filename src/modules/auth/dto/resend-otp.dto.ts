import { IsMongoId } from 'class-validator';

export class ResendOtpDto {
  @IsMongoId()
  otpTokenId: string;
}
