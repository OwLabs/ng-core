import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleEmailService } from './console-email.service';

describe('ConsoleEmailService', () => {
  let service: ConsoleEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsoleEmailService],
    }).compile();

    service = module.get<ConsoleEmailService>(ConsoleEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
