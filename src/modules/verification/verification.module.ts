import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentHash } from '../../entities/document-hash.entity';
import { NotarizedDocument } from '../../entities/notarized-document.entity';
import { VerificationRequest } from '../../entities/verification-request.entity';
import { AuditModule } from '../audit/audit.module';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotarizedDocument,
      DocumentHash,
      VerificationRequest,
    ]),
    AuditModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}