import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DocumentHashDataRepository } from '../../repositories/document-hash-data.repository';
import { NotarizedDocumentDataRepository } from '../../repositories/notarized-document-data.repository';
import { VerificationRequestDataRepository } from '../../repositories/verification-request-data.repository';
import { AuditService } from '../audit/audit.service';
import { VerifyDocumentDto } from './dto/verify-document.dto';

@Injectable()
export class VerificationService {
  constructor(
    private readonly documentRepository: NotarizedDocumentDataRepository,
    private readonly hashRepository: DocumentHashDataRepository,
    private readonly verificationRequestRepository: VerificationRequestDataRepository,
    private readonly auditService: AuditService,
  ) {}

  async verify(dto: VerifyDocumentDto, ip?: string) {
    if (!dto.serialNumber && !dto.sha256Hash) {
      throw new BadRequestException('serialNumber or sha256Hash is required');
    }

    let document = null;

    if (dto.serialNumber) {
      document = await this.documentRepository.findBySerialNumber(dto.serialNumber);
    }

    if (!document && dto.sha256Hash) {
      const hash = await this.hashRepository.findBySha256Hash(dto.sha256Hash);

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