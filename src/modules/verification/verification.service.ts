import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VerificationRequest,
  VerificationStatus,
  VerificationMethod,
} from '../../entities/verification-request.entity';
import { NotarizedDocument, DocumentStatus } from '../../entities/notarized-document.entity';
import { DocumentHash } from '../../entities/document-hash.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditSeverity } from '../../entities/audit-log.entity';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { paginate } from '../../utils/response.util';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationRequest)
    private readonly verificationRepository: Repository<VerificationRequest>,
    @InjectRepository(NotarizedDocument)
    private readonly documentRepository: Repository<NotarizedDocument>,
    @InjectRepository(DocumentHash)
    private readonly hashRepository: Repository<DocumentHash>,
    private readonly auditService: AuditService,
  ) {}

  async verifyDocument(
    dto: VerifyDocumentDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    status: VerificationStatus;
    document?: Partial<NotarizedDocument>;
    verificationId: string;
    verifiedAt: Date;
  }> {
    const method = dto.method || VerificationMethod.SERIAL_NUMBER;
    let document: NotarizedDocument | null = null;

    if (method === VerificationMethod.DOCUMENT_HASH) {
      const hash = await this.hashRepository.findOne({
        where: { sha256Hash: dto.queryValue },
        relations: ['notarizedDocument', 'notarizedDocument.notarialRegister', 'notarizedDocument.notarialRegister.lawyer'],
      });
      document = hash?.notarizedDocument || null;
    } else {
      document = await this.documentRepository.findOne({
        where: { serialNumber: dto.queryValue },
        relations: ['notarialRegister', 'notarialRegister.lawyer', 'documentHashes'],
      });
    }

    let verificationStatus: VerificationStatus;
    if (!document) {
      verificationStatus = VerificationStatus.NOT_FOUND;
    } else if (document.status === DocumentStatus.REVOKED) {
      verificationStatus = VerificationStatus.REVOKED;
    } else if (document.isFraudFlagged) {
      verificationStatus = VerificationStatus.FLAGGED;
    } else if (document.status === DocumentStatus.VALID) {
      verificationStatus = VerificationStatus.VERIFIED;
    } else {
      verificationStatus = VerificationStatus.INVALID;
    }

    const verificationReq = this.verificationRepository.create({
      documentId: document?.id,
      queryValue: dto.queryValue,
      verificationMethod: method,
      status: verificationStatus,
      requesterName: dto.requesterName,
      requesterOrganization: dto.requesterOrganization,
      ipAddress,
      userAgent,
    });
    const saved = await this.verificationRepository.save(verificationReq);

    await this.auditService.log({
      action: AuditAction.VERIFICATION_REQUEST,
      severity: AuditSeverity.INFO,
      entityType: 'notarized_document',
      entityId: document?.id,
      ipAddress,
      userAgent,
      metadata: {
        queryValue: dto.queryValue,
        method,
        result: verificationStatus,
        requester: dto.requesterName,
      },
      description: `Document verification: ${verificationStatus} for query "${dto.queryValue}"`,
    });

    const sanitizedDocument = document
      ? this.sanitizeDocument(document)
      : undefined;

    return {
      status: verificationStatus,
      document: sanitizedDocument,
      verificationId: saved.id,
      verifiedAt: saved.createdAt,
    };
  }

  async getVerificationHistory(
    documentId: string,
    page = 1,
    limit = 20,
  ) {
    const [requests, total] = await this.verificationRepository.findAndCount({
      where: { documentId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(requests, total, page, limit);
  }

  async getVerificationStats(): Promise<{
    total: number;
    verified: number;
    notFound: number;
    flagged: number;
    revoked: number;
  }> {
    const stats = await this.verificationRepository
      .createQueryBuilder('vr')
      .select('vr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('vr.status')
      .getRawMany<{ status: VerificationStatus; count: string }>();

    const result = {
      total: 0,
      verified: 0,
      notFound: 0,
      flagged: 0,
      revoked: 0,
    };

    for (const row of stats) {
      const count = parseInt(row.count, 10);
      result.total += count;
      if (row.status === VerificationStatus.VERIFIED) result.verified = count;
      if (row.status === VerificationStatus.NOT_FOUND) result.notFound = count;
      if (row.status === VerificationStatus.FLAGGED) result.flagged = count;
      if (row.status === VerificationStatus.REVOKED) result.revoked = count;
    }

    return result;
  }

  private sanitizeDocument(doc: NotarizedDocument): Partial<NotarizedDocument> {
    return {
      id: doc.id,
      serialNumber: doc.serialNumber,
      documentType: doc.documentType,
      documentTitle: doc.documentTitle,
      principalName: doc.principalName,
      notarizationDate: doc.notarizationDate,
      status: doc.status,
      isFraudFlagged: doc.isFraudFlagged,
      notarialRegister: doc.notarialRegister,
      createdAt: doc.createdAt,
    };
  }
}
