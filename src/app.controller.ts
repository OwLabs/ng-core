import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiVersionEnum } from './common/config';

@ApiTags('Health')
@Controller({
  path: 'health',
  version: ApiVersionEnum.V1,
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getAppStatus() {
    return this.appService.getAppStatus();
  }
}
