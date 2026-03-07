import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudDetectionService } from './fraud-detection.service';
import { FraudController } from './fraud.controller';
import { NotarizedDocument } from '../../entities/notarized-document.entity';
import { DocumentHash } from '../../entities/document-hash.entity';
import { Lawyer } from '../../entities/lawyer.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotarizedDocument, DocumentHash, Lawyer]),
    AuditModule,
  ],
  controllers: [FraudController],
  providers: [FraudDetectionService],
  exports: [FraudDetectionService],
})
export class FraudModule {}
