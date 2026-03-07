import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { AuditModule } from '../audit/audit.module';
import { FraudController } from './fraud.controller';
import { FRAUD_ANALYSIS_QUEUE } from './fraud.constants';
import { FraudProcessor } from './fraud.processor';
import { FraudService } from './fraud.service';

@Module({
  imports: [
    RepositoriesModule,
    AuditModule,
    BullModule.registerQueue({
      name: FRAUD_ANALYSIS_QUEUE,
    }),
  ],
  controllers: [FraudController],
  providers: [FraudService, FraudProcessor],
  exports: [FraudService],
})
export class FraudModule {}