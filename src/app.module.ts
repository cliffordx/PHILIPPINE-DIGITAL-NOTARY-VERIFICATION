import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { NotaryModule } from './modules/notary/notary.module';
import { VerificationModule } from './modules/verification/verification.module';
import { AuditModule } from './modules/audit/audit.module';
import { FraudModule } from './modules/fraud/fraud.module';

import { Lawyer } from './entities/lawyer.entity';
import { NotarialRegister } from './entities/notarial-register.entity';
import { NotarizedDocument } from './entities/notarized-document.entity';
import { DocumentHash } from './entities/document-hash.entity';
import { AuditLog } from './entities/audit-log.entity';
import { VerificationRequest } from './entities/verification-request.entity';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

import { HttpExceptionFilter } from './middleware/http-exception.filter';
import { LoggingInterceptor } from './middleware/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: [
          Lawyer,
          NotarialRegister,
          NotarizedDocument,
          DocumentHash,
          AuditLog,
          VerificationRequest,
        ],
        synchronize: config.get<boolean>('database.synchronize', false),
        logging: config.get<boolean>('database.logging', false),
        ssl: config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('app.throttleTtl', 60) * 1000,
            limit: config.get<number>('app.throttleLimit', 100),
          },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    NotaryModule,
    VerificationModule,
    AuditModule,
    FraudModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
