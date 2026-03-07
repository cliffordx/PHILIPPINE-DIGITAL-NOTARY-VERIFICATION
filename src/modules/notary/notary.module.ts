import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { AuditModule } from '../audit/audit.module';
import { FraudModule } from '../fraud/fraud.module';
import { NotaryController } from './notary.controller';
import { NotaryService } from './notary.service';

@Module({
  imports: [RepositoriesModule, AuditModule, FraudModule],
  controllers: [NotaryController],
  providers: [NotaryService],
})
export class NotaryModule {}