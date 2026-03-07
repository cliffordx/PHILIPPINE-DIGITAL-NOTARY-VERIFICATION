import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentHash } from '../../entities/document-hash.entity';
import { NotarizedDocument } from '../../entities/notarized-document.entity';
import { VerificationRequest } from '../../entities/verification-request.entity';
import { AuditService } from '../audit/audit.service';
import { VerifyDocumentDto } from './dto/verify-document.dto';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(NotarizedDocument)
    private readonly documentRepository: Repository<NotarizedDocument>,
    @InjectRepository(DocumentHash)
    private readonly hashRepository: Repository<DocumentHash>,
    @InjectRepository(VerificationRequest)
    private readonly verificationRequestRepository: Repository<VerificationRequest>,
    private readonly auditService: AuditService,
  ) {}

  async verify(dto: VerifyDocumentDto, ip?: string) {
    if (!dto.serialNumber && !dto.sha256Hash) {
      throw new BadRequestException('serialNumber or sha256Hash is required');
    }

    let document: NotarizedDocument | null = null;

    if (dto.serialNumber) {
      document = await this.documentRepository.findOne({
        where: { serialNumber: dto.serialNumber },
        relations: ['register', 'lawyer', 'hashes'],
      });
    }

    if (!document && dto.sha256Hash) {
      const hash = await this.hashRepository.findOne({
        where: { sha256Hash: dto.sha256Hash },
        relations: ['document', 'document.lawyer', 'document.register'],
      });

      if (hash) {
        document = hash.document;
      }
    }

    await this.verificationRequestRepository.save({
      serialNumber: dto.serialNumber,
      sha256Hash: dto.sha256Hash,
      requestIp: ip,
      resultStatus: document ? 'MATCHED' : 'NOT_FOUND',
      matchedDocumentId: document?.id,
    });

    await this.auditService.log({
      action: 'DOCUMENT_VERIFIED',
      resourceType: 'NOTARIZED_DOCUMENT',
      resourceId: document?.id,
      metadata: {
        serialNumber: dto.serialNumber,
        sha256Hash: dto.sha256Hash,
        matched: Boolean(document),
      },
      requestIp: ip,
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      status: 'success',
      data: {
        verified: true,
        document: {
          id: document.id,
          serialNumber: document.serialNumber,
          documentType: document.documentType,
          principalName: document.principalName,
          notarizedAt: document.notarizedAt,
          status: document.status,
          lawyer: document.lawyer
            ? {
                id: document.lawyer.id,
                fullName: document.lawyer.fullName,
                ibpNumber: document.lawyer.ibpNumber,
              }
            : undefined,
        },
      },
    };
  }
}