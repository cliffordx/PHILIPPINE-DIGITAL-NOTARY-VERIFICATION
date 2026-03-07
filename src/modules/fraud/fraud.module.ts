import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentHash } from '../../entities/document-hash.entity';
import { FraudAlert } from '../../entities/fraud-alert.entity';
import { NotarizedDocument } from '../../entities/notarized-document.entity';
import { AuditModule } from '../audit/audit.module';
import { FraudService } from './fraud.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FraudAlert, NotarizedDocument, DocumentHash]),
    AuditModule,
  ],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}