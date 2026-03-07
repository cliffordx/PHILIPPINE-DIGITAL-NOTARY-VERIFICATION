import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentHash } from '../../entities/document-hash.entity';
import { Lawyer } from '../../entities/lawyer.entity';
import { NotarialRegister } from '../../entities/notarial-register.entity';
import { NotarizedDocument } from '../../entities/notarized-document.entity';
import { AuditModule } from '../audit/audit.module';
import { FraudModule } from '../fraud/fraud.module';
import { NotaryController } from './notary.controller';
import { NotaryService } from './notary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotarialRegister,
      NotarizedDocument,
      DocumentHash,
      Lawyer,
    ]),
    AuditModule,
    FraudModule,
  ],
  controllers: [NotaryController],
  providers: [NotaryService],
})
export class NotaryModule {}