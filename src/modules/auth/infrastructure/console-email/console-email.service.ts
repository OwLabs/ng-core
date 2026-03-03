import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsoleEmailService {
  constructor(private readonly console: Console) {}
  async sendOtpEmail(to: string, code: string) {
    this.console.log(`Sending OTP email to ${to}: Your OTP code is ${code}`);
  }
}
