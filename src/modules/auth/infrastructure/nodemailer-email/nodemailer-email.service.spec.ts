import { Test, TestingModule } from '@nestjs/testing';
import { NodemailerEmailService } from './nodemailer-email.service';

describe('NodemailerEmailService', () => {
  let service: NodemailerEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NodemailerEmailService],
    }).compile();

    service = module.get<NodemailerEmailService>(NodemailerEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
