import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get<string[]>('app.corsOrigins', ['http://localhost:3000']),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger / OpenAPI documentation
  if (configService.get<string>('app.nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Philippine Digital Notary Verification API')
      .setDescription(
        'Secure backend API for the Integrated Bar of the Philippines (IBP) to digitally track, serialize, and audit notarial registers. Prevents illegal mass notarization, fraudulent documents, and abuse of notarial privileges.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication')
      .addTag('Notary')
      .addTag('Verification')
      .addTag('Audit')
      .addTag('Fraud Detection')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(port);
  console.log(
    `Philippine Digital Notary Verification API running on: http://localhost:${port}/${apiPrefix}`,
  );
  if (configService.get<string>('app.nodeEnv') !== 'production') {
    console.log(
      `Swagger docs available at: http://localhost:${port}/${apiPrefix}/docs`,
    );
  }
}
bootstrap();
