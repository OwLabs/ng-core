import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  IOTPTokenRepository,
  OTP_TOKEN_REPOSITORY,
} from '../domain/repositories';
import {
  EMAIL_SERVICE,
  IEmailService,
} from '../domain/repositories/email-service.interface';
import { randomInt } from 'crypto';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { OtpToken } from '../domain/entities';
import { OtpStatus } from '../domain/enums/otp-status.enum';
@Injectable()
export class OtpTokenService {
  constructor(
    @Inject(OTP_TOKEN_REPOSITORY)
    private readonly otpTokenRepo: IOTPTokenRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async generateAndSendOtp(
    userId: Types.ObjectId | string,
    email: string,
  ): Promise<string> {
    const code = randomInt(100000, 1000000);
    const hashedCode = await bcrypt.hash(code.toString(), 10);
    const tokenId = new Types.ObjectId();
    const expiryDate = new Date(Date.now() + 60000 * 10);

    const otpToken = OtpToken.create({
      id: tokenId,
      userId: userId.toString(),
      email,
      codeHash: hashedCode,
      maxAttempts: 5,
      maxResends: 3,
      status: OtpStatus.PENDING,
      expiresAt: expiryDate,
    });
    await this.otpTokenRepo.save(otpToken);

    await this.emailService.sendOtpEmail(email, code.toString());
    return tokenId.toString();
  }

  async verifyOtp(
    tokenId: Types.ObjectId | string,
    code: string,
  ): Promise<{ userId: string }> {
    const otpToken = await this.otpTokenRepo.findById(tokenId.toString());
    if (!otpToken) {
      throw new UnauthorizedException('Invalid OTP token');
    }

    if (otpToken.isExpired()) {
      throw new UnauthorizedException('OTP token has expired');
    }

    if (otpToken.isMaxAttemptsReached()) {
      throw new UnauthorizedException('Maximum OTP attempts reached');
    }

    const isMatch = await bcrypt.compare(code, otpToken.codeHash);

    if (!isMatch) {
      otpToken.incrementAttempts();
      await this.otpTokenRepo.update(otpToken.id.toString(), otpToken);
      throw new UnauthorizedException('Invalid OTP code');
    }

    return { userId: otpToken.userId.toString() };
  }

  async resendOtp(otpTokenId: Types.ObjectId | string): Promise<void> {
    const otpToken = await this.otpTokenRepo.findById(otpTokenId.toString());

    if (!otpToken) {
      throw new UnauthorizedException('Invalid OTP session');
    }

    if (otpToken.isMaxResendsReached()) {
      throw new UnauthorizedException('Maximum OTP resends reached');
    }

    if (otpToken.status == OtpStatus.VERIFIED) {
      throw new UnauthorizedException('OTP already verified');
    }

    const newCode = randomInt(100000, 1000000);
    const newHashedCode = await bcrypt.hash(newCode.toString(), 10);
    const newExpiry = new Date(Date.now() + 60000 * 10);

    await this.otpTokenRepo.updateCodeHash(
      otpTokenId.toString(),
      newHashedCode,
      newExpiry,
    );

    await this.emailService.sendOtpEmail(otpToken.email, newCode.toString());
  }
}
