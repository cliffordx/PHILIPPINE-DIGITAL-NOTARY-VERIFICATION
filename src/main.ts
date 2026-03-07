import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './config/swagger.config';
import { startTelemetry, stopTelemetry } from './config/telemetry';

const startupKeepAlive = setInterval(() => undefined, 1_000);

async function bootstrap() {
  const telemetryStartup = startTelemetry();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  await telemetryStartup;

  app.useLogger(app.get(Logger));

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
  app.enableShutdownHooks();
  await app.listen(port);

  clearInterval(startupKeepAlive);
}

void bootstrap().catch((error: unknown) => {
  clearInterval(startupKeepAlive);
  console.error(error);
  process.exit(1);
});

process.on('SIGINT', () => {
  void stopTelemetry();
});

process.on('SIGTERM', () => {
  void stopTelemetry();
});