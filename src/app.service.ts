import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getAppStatus() {
    return {
      status: 'sucess',
      message: 'NeuralGuru Core API is running',
      environment:
        this.configService.getOrThrow<string>('NODE_ENV') || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
