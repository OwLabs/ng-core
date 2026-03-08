import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { ApiVersionEnum, SwaggerVersionEnum } from './common/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  WINSTON_MODULE_NEST_PROVIDER,
  WINSTON_MODULE_PROVIDER,
} from 'nest-winston';
import { GlobalExceptionFilter } from './core/exceptions/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // IMPORTANT: Tell NestJS to wait for our custom logger
  });

  // Tell the entire Nest application to use Winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalFilters(
    new GlobalExceptionFilter(app.get(WINSTON_MODULE_PROVIDER)),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    // We set the prefix to an empty string so that the URL starts directly with the version number (e.g., /v1/...)
    prefix: '',
    defaultVersion: ApiVersionEnum.V1,
  });

  const config = new DocumentBuilder()
    .setTitle('ng-core API')
    .setDescription('ng-core API documentation')
    .setVersion(SwaggerVersionEnum.V1)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('internal-ng-core-api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
