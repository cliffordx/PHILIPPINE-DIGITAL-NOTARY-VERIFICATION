import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { DocumentHash } from '../entities/document-hash.entity';
import { FraudAlert } from '../entities/fraud-alert.entity';
import { Lawyer } from '../entities/lawyer.entity';
import { NotarialRegister } from '../entities/notarial-register.entity';
import { NotarizedDocument } from '../entities/notarized-document.entity';
import { VerificationRequest } from '../entities/verification-request.entity';
import { AuditLogDataRepository } from './audit-log-data.repository';
import { DocumentHashDataRepository } from './document-hash-data.repository';
import { FraudAlertDataRepository } from './fraud-alert-data.repository';
import { LawyerDataRepository } from './lawyer-data.repository';
import { NotarialRegisterDataRepository } from './notarial-register-data.repository';
import { NotarizedDocumentDataRepository } from './notarized-document-data.repository';
import { VerificationRequestDataRepository } from './verification-request-data.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lawyer,
      NotarialRegister,
      NotarizedDocument,
      DocumentHash,
      AuditLog,
      VerificationRequest,
      FraudAlert,
    ]),
  ],
  providers: [
    LawyerDataRepository,
    NotarialRegisterDataRepository,
    NotarizedDocumentDataRepository,
    DocumentHashDataRepository,
    AuditLogDataRepository,
    VerificationRequestDataRepository,
    FraudAlertDataRepository,
  ],
  exports: [
    LawyerDataRepository,
    NotarialRegisterDataRepository,
    NotarizedDocumentDataRepository,
    DocumentHashDataRepository,
    AuditLogDataRepository,
    VerificationRequestDataRepository,
    FraudAlertDataRepository,
  ],
})
export class RepositoriesModule {}
