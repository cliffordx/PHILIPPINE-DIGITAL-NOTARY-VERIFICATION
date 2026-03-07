import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { buildSerialNumber } from '../../common/utils/serial-number.util';
import { DocumentHash } from '../../entities/document-hash.entity';
import { NotarialRegister } from '../../entities/notarial-register.entity';
import { NotarizedDocument } from '../../entities/notarized-document.entity';
import { AuditService } from '../audit/audit.service';
import { FraudService } from '../fraud/fraud.service';
import { CreateNotarizationDto } from './dto/create-notarization.dto';
import { LawyerHistoryQueryDto } from './dto/lawyer-history-query.dto';

@Injectable()
export class NotaryService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(NotarialRegister)
    private readonly registerRepository: Repository<NotarialRegister>,
    @InjectRepository(NotarizedDocument)
    private readonly documentRepository: Repository<NotarizedDocument>,
    @InjectRepository(DocumentHash)
    private readonly hashRepository: Repository<DocumentHash>,
    private readonly auditService: AuditService,
    private readonly fraudService: FraudService,
  ) {}

  async registerNotarization(dto: CreateNotarizationDto, actor: any, ip?: string) {
    const existingHash = await this.hashRepository.findOne({
      where: { sha256Hash: dto.sha256Hash },
      relations: ['document'],
    });

    const register = await this.registerRepository.findOne({
      where: { id: dto.registerId },
    });

    if (!register) {
      throw new NotFoundException('Register not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const count = await manager.getRepository(NotarizedDocument).count({
        where: { registerId: dto.registerId },
      });

      const sequence = count + 1;
      const serialNumber = buildSerialNumber({
        lawyerId: actor.userId,
        registerBook: register.registerBookCode,
        timestamp: new Date(dto.notarizedAt),
        sequence,
      });

      const duplicateSerial = await manager
        .getRepository(NotarizedDocument)
        .findOne({
          where: { serialNumber },
        });

      if (duplicateSerial) {
        throw new ConflictException('Serial number collision detected');
      }

      const document = manager.getRepository(NotarizedDocument).create({
        lawyerId: actor.userId,
        registerId: dto.registerId,
        serialNumber,
        documentType: dto.documentType,
        principalName: dto.principalName,
        notarizedAt: new Date(dto.notarizedAt),
        sequenceNumber: sequence,
        status: 'ACTIVE',
      });

      const savedDoc = await manager.getRepository(NotarizedDocument).save(document);

      const hash = manager.getRepository(DocumentHash).create({
        documentId: savedDoc.id,
        sha256Hash: dto.sha256Hash,
        sourceFilename: dto.sourceFilename,
      });

      await manager.getRepository(DocumentHash).save(hash);

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

  async getLawyerHistory(query: LawyerHistoryQueryDto, actor: any) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const lawyerId =
      actor.role === 'NOTARY' ? actor.userId : (query.lawyerId ?? actor.userId);

    const [items, total] = await this.documentRepository.findAndCount({
      where: { lawyerId },
      order: { notarizedAt: 'DESC' },
      skip,
      take: limit,
      relations: ['hashes', 'register'],
    });

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