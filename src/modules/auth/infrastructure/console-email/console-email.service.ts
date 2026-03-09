import { Injectable } from '@nestjs/common';
import { IEmailService } from '../../domain/email-service.interface';

@Injectable()
export class ConsoleEmailService implements IEmailService {
  constructor(private readonly console: Console) {}
  async sendOtpEmail(to: string, code: string) {
    this.console.log(`Sending OTP email to ${to}: Your OTP code is ${code}`);
  }
}
