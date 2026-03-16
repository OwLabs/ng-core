import { Injectable } from '@nestjs/common';
import { IEmailService } from '../domain/repositories';

@Injectable()
export class ConsoleEmailService implements IEmailService {
  async sendOtpEmail(to: string, code: string) {
    console.log(`Sending OTP email to ${to}: Your OTP code is ${code}`);
  }
}
