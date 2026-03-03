import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NodemailerEmailService {
  constructor(private readonly mailerService: MailerService) {}
  async sendOtpEmail(to: string, code: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Your Verification Code',
      text: `Your OTP code is: ${code}. The code will expires in 5 minutes.`,
    });
  }
}
