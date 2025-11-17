import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { ApiVersionEnum, SwaggerVersionEnum } from './api';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
