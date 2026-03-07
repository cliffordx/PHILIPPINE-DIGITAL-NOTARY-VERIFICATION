import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RequestActor } from '../../common/interfaces/request-actor.interface';
import { buildSerialNumber } from '../../common/utils/serial-number.util';
import { DocumentHashDataRepository } from '../../repositories/document-hash-data.repository';
import { NotarialRegisterDataRepository } from '../../repositories/notarial-register-data.repository';
import { NotarizedDocumentDataRepository } from '../../repositories/notarized-document-data.repository';
import { AuditService } from '../audit/audit.service';
import { FraudService } from '../fraud/fraud.service';
import { CreateNotarizationDto } from './dto/create-notarization.dto';
import { LawyerHistoryQueryDto } from './dto/lawyer-history-query.dto';

@Injectable()
export class NotaryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly registerRepository: NotarialRegisterDataRepository,
    private readonly documentRepository: NotarizedDocumentDataRepository,
    private readonly hashRepository: DocumentHashDataRepository,
    private readonly auditService: AuditService,
    private readonly fraudService: FraudService,
  ) {}

  async registerNotarization(
    dto: CreateNotarizationDto,
    actor: RequestActor,
    ip?: string,
  ) {
    const existingHash = await this.hashRepository.findBySha256Hash(dto.sha256Hash);

    const register = await this.registerRepository.findById(dto.registerId);

    if (!register) {
      throw new NotFoundException('Register not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const count = await this.documentRepository.countByRegisterId(
        dto.registerId,
        manager,
      );

      const sequence = count + 1;
      const serialNumber = buildSerialNumber({
        lawyerId: actor.userId,
        registerBook: register.registerBookCode,
        timestamp: new Date(dto.notarizedAt),
        sequence,
      });

      const duplicateSerial = await this.documentRepository.findBySerialNumber(
        serialNumber,
        manager,
      );

      if (duplicateSerial) {
        throw new ConflictException('Serial number collision detected');
      }

      const savedDoc = await this.documentRepository.createAndSave(
        {
        lawyerId: actor.userId,
        registerId: dto.registerId,
        serialNumber,
        documentType: dto.documentType,
        principalName: dto.principalName,
        notarizedAt: new Date(dto.notarizedAt),
        sequenceNumber: sequence,
        status: 'ACTIVE',
        },
        manager,
      );

      await this.hashRepository.createAndSave(
        {
          documentId: savedDoc.id,
          sha256Hash: dto.sha256Hash,
          sourceFilename: dto.sourceFilename,
        },
        manager,
      );

      await this.auditService.log({
        actorId: actor.userId,
        actorRole: actor.role,
        action: 'NOTARIZATION_REGISTERED',
        resourceType: 'NOTARIZED_DOCUMENT',
        resourceId: savedDoc.id,
        metadata: {
          serialNumber,
          duplicateHashDetected: Boolean(existingHash),
        },
        requestIp: ip,
      });

      await this.fraudService.enqueueAnalysis({
        lawyerId: actor.userId,
        documentId: savedDoc.id,
        sha256Hash: dto.sha256Hash,
        notarizedAt: dto.notarizedAt,
      });

      return {
        status: 'success',
        data: {
          id: savedDoc.id,
          serialNumber,
          sequenceNumber: sequence,
          duplicateHashDetected: Boolean(existingHash),
        },
      };
    });
  }

  async getLawyerHistory(query: LawyerHistoryQueryDto, actor: RequestActor) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const lawyerId =
      actor.role === 'NOTARY' ? actor.userId : (query.lawyerId ?? actor.userId);

    const [items, total] = await this.documentRepository.findLawyerHistory(
      lawyerId,
      skip,
      limit,
    );

    return {
      status: 'success',
      data: {
        page,
        limit,
        total,
        items,
      },
    };
  }
}