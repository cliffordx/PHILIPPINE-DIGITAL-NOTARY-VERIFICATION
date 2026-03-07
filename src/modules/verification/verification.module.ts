import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../../repositories/repositories.module';
import { AuditModule } from '../audit/audit.module';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [RepositoriesModule, AuditModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}