import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IOtpTokenRepository,
  OTP_TOKEN_REPOSITORY,
  EMAIL_SERVICE,
  IEmailService,
} from '../domain/repositories';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { OtpToken } from '../domain/entities';
import { generateOtp } from 'src/common/utils';
@Injectable()
export class OtpTokenService {
  constructor(
    @Inject(OTP_TOKEN_REPOSITORY)
    private readonly otpTokenRepo: IOtpTokenRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async generateAndSendOtp(
    userId: Types.ObjectId | string,
    email: string,
  ): Promise<{ otpTokenId: string }> {
    const code = generateOtp();
    const hashedCode = await bcrypt.hash(code, 10);
    const tokenId = new Types.ObjectId();
    const expiryDate = new Date(Date.now() + 5 * 60 * 1000);

    const otpToken = OtpToken.create({
      id: tokenId,
      userId,
      email,
      codeHash: hashedCode,
      expiresAt: expiryDate,
    });
    await this.otpTokenRepo.save(otpToken);

    await this.emailService.sendOtpEmail(email, code);
    return { otpTokenId: tokenId.toString() };
  }

  async verifyOtp(tokenId: string, code: string): Promise<{ userId: string }> {
    const otpToken = await this.otpTokenRepo.findById(tokenId);
    if (!otpToken) {
      throw new UnauthorizedException('Invalid OTP token');
    }

    if (otpToken.isExpired()) {
      throw new UnauthorizedException('OTP token has expired');
    }

    if (otpToken.isMaxAttemptsReached()) {
      otpToken.revoke();
      await this.otpTokenRepo.update(otpToken);
      throw new UnauthorizedException('Maximum OTP attempts reached');
    }

    const isMatch = await bcrypt.compare(code, otpToken.codeHash);

    if (!isMatch) {
      otpToken.incrementAttempts();
      await this.otpTokenRepo.update(otpToken);
      throw new UnauthorizedException('Invalid OTP code');
    }

    otpToken.markAsVerified();
    await this.otpTokenRepo.update(otpToken);

    return { userId: otpToken.userId.toString() };
  }

  async resendOtp(otpTokenId: string): Promise<void> {
    const otpToken = await this.otpTokenRepo.findById(otpTokenId);

    if (!otpToken) {
      throw new UnauthorizedException('Invalid OTP session');
    }

    if (otpToken.isVerified()) {
      throw new BadRequestException('OTP already verified');
    }

    if (otpToken.isMaxResendsReached()) {
      throw new HttpException(
        'Resend limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const newCode = generateOtp();
    const newHashedCode = await bcrypt.hash(newCode, 10);
    const newExpiry = new Date(Date.now() + 5 * 60 * 1000);

    otpToken.updateCodeHash(newHashedCode);
    otpToken.incrementResends();
    otpToken.updateExpiry(newExpiry);

    await this.otpTokenRepo.update(otpToken);

    await this.emailService.sendOtpEmail(otpToken.email, newCode);
  }
}
