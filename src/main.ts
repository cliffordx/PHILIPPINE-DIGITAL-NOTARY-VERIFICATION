import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  setupSwagger(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

void bootstrap();