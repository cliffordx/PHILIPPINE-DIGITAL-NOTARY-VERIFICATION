import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard';
import { envValidationSchema } from './config/env.validation';
import { typeOrmConfigFactory } from './config/typeorm.config';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { HealthModule } from './modules/health/health.module';
import { NotaryModule } from './modules/notary/notary.module';
import { VerificationModule } from './modules/verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
    }),
    AuthModule,
    NotaryModule,
    VerificationModule,
    AuditModule,
    FraudModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {}