import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { VerificationRequest } from '../../entities/verification-request.entity';
import { NotarizedDocument } from '../../entities/notarized-document.entity';
import { DocumentHash } from '../../entities/document-hash.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VerificationRequest,
      NotarizedDocument,
      DocumentHash,
    ]),
    AuditModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
