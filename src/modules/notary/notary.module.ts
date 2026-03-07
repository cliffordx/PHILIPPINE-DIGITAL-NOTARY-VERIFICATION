import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotaryController } from './notary.controller';
import { NotaryService } from './notary.service';
import { NotarialRegister } from '../../entities/notarial-register.entity';
import { NotarizedDocument } from '../../entities/notarized-document.entity';
import { DocumentHash } from '../../entities/document-hash.entity';
import { Lawyer } from '../../entities/lawyer.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotarialRegister,
      NotarizedDocument,
      DocumentHash,
      Lawyer,
    ]),
    AuditModule,
  ],
  controllers: [NotaryController],
  providers: [NotaryService],
  exports: [NotaryService],
})
export class NotaryModule {}
