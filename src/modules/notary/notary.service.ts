import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  NotarialRegister,
  RegisterStatus,
} from '../../entities/notarial-register.entity';
import {
  NotarizedDocument,
  DocumentStatus,
} from '../../entities/notarized-document.entity';
import { DocumentHash } from '../../entities/document-hash.entity';
import { Lawyer, LawyerStatus } from '../../entities/lawyer.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditSeverity } from '../../entities/audit-log.entity';
import { CreateNotarizationDto } from './dto/create-notarization.dto';
import { CreateRegisterDto } from './dto/create-register.dto';
import {
  generateSerialNumber,
  generateVerificationChecksum,
} from '../../utils/crypto.util';
import { paginate } from '../../utils/response.util';

@Injectable()
export class NotaryService {
  constructor(
    @InjectRepository(NotarialRegister)
    private readonly registerRepository: Repository<NotarialRegister>,
    @InjectRepository(NotarizedDocument)
    private readonly documentRepository: Repository<NotarizedDocument>,
    @InjectRepository(DocumentHash)
    private readonly hashRepository: Repository<DocumentHash>,
    @InjectRepository(Lawyer)
    private readonly lawyerRepository: Repository<Lawyer>,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async createRegister(
    lawyerId: string,
    dto: CreateRegisterDto,
    ipAddress?: string,
  ): Promise<NotarialRegister> {
    const lawyer = await this.lawyerRepository.findOne({
      where: { id: lawyerId },
    });
    if (!lawyer || lawyer.status !== LawyerStatus.ACTIVE) {
      throw new BadRequestException('Lawyer is not active or does not exist');
    }

    const year = dto.year || new Date().getFullYear();
    const bookNumber = dto.bookNumber || 1;

    const existing = await this.registerRepository.findOne({
      where: { lawyerId, year, bookNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Register for year ${year}, book ${bookNumber} already exists`,
      );
    }

    const register = this.registerRepository.create({
      lawyerId,
      year,
      bookNumber,
      maxEntries: dto.maxEntries || 500,
      openedAt: new Date(),
      status: RegisterStatus.ACTIVE,
    });
    const saved = await this.registerRepository.save(register);

    await this.auditService.log({
      lawyerId,
      action: AuditAction.REGISTER_CREATED,
      severity: AuditSeverity.INFO,
      entityType: 'notarial_register',
      entityId: saved.id,
      ipAddress,
      description: `Register opened: Year ${year}, Book ${bookNumber}`,
    });

    return saved;
  }

  async notarizeDocument(
    lawyerId: string,
    dto: CreateNotarizationDto,
    ipAddress?: string,
  ): Promise<NotarizedDocument> {
    const lawyer = await this.lawyerRepository.findOne({
      where: { id: lawyerId },
    });
    if (!lawyer || lawyer.status !== LawyerStatus.ACTIVE) {
      throw new BadRequestException('Lawyer is not active');
    }

    const now = new Date();
    const year = now.getFullYear();

    // Check for duplicate hash
    const existingHash = await this.hashRepository.findOne({
      where: { sha256Hash: dto.documentHash },
    });
    if (existingHash) {
      throw new ConflictException(
        'A document with this hash has already been notarized',
      );
    }

    // Find or use active register
    const register = await this.registerRepository.findOne({
      where: { lawyerId, year, status: RegisterStatus.ACTIVE },
      order: { bookNumber: 'DESC' },
    });
    if (!register) {
      throw new NotFoundException(
        `No active notarial register found for year ${year}. Please create one first.`,
      );
    }

    if (register.sequenceCounter >= register.maxEntries) {
      throw new BadRequestException(
        'Current notarial register is full. Please create a new register book.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Atomically increment the sequence counter
      await manager.increment(
        NotarialRegister,
        { id: register!.id },
        'sequenceCounter',
        1,
      );

      // Reload to get updated sequence
      const refreshedRegister = await manager.findOne(NotarialRegister, {
        where: { id: register!.id },
      });
      if (!refreshedRegister) {
        throw new NotFoundException('Notarial register not found after update');
      }
      const sequence = refreshedRegister.sequenceCounter;

      const serialNumber = generateSerialNumber(
        lawyer.rollNumber,
        year,
        refreshedRegister.bookNumber,
        sequence,
      );

      const document = manager.create(NotarizedDocument, {
        serialNumber,
        registerId: refreshedRegister.id,
        documentType: dto.documentType,
        documentTitle: dto.documentTitle,
        principalName: dto.principalName,
        principalAddress: dto.principalAddress,
        notarizationDate: new Date(dto.notarizationDate),
        notarizationTime: dto.notarizationTime,
        bookNumber: refreshedRegister.bookNumber,
        seriesNumber: sequence,
        status: DocumentStatus.VALID,
        remarks: dto.remarks,
      });
      const savedDoc = await manager.save(NotarizedDocument, document);

      const hash = manager.create(DocumentHash, {
        documentId: savedDoc.id,
        sha256Hash: dto.documentHash,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        fileSizeBytes: dto.fileSizeBytes,
        isPrimary: true,
      });
      await manager.save(DocumentHash, hash);

      await this.auditService.log({
        lawyerId,
        action: AuditAction.DOCUMENT_NOTARIZED,
        severity: AuditSeverity.INFO,
        entityType: 'notarized_document',
        entityId: savedDoc.id,
        ipAddress,
        metadata: {
          serialNumber,
          documentType: dto.documentType,
          principalName: dto.principalName,
        },
        description: `Document notarized: ${serialNumber}`,
      });

      return savedDoc;
    });
  }

  async getLawyerDocuments(
    lawyerId: string,
    page = 1,
    limit = 20,
  ) {
    const [documents, total] = await this.documentRepository
      .createQueryBuilder('doc')
      .innerJoin('doc.notarialRegister', 'register')
      .where('register.lawyerId = :lawyerId', { lawyerId })
      .orderBy('doc.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return paginate(documents, total, page, limit);
  }

  async getRegister(registerId: string): Promise<NotarialRegister> {
    const register = await this.registerRepository.findOne({
      where: { id: registerId },
      relations: ['lawyer'],
    });
    if (!register) {
      throw new NotFoundException('Notarial register not found');
    }
    return register;
  }

  async getLawyerRegisters(lawyerId: string): Promise<NotarialRegister[]> {
    return this.registerRepository.find({
      where: { lawyerId },
      order: { year: 'DESC', bookNumber: 'DESC' },
    });
  }

  async getDocumentById(documentId: string): Promise<NotarizedDocument> {
    const doc = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['documentHashes', 'notarialRegister', 'notarialRegister.lawyer'],
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  async revokeDocument(
    documentId: string,
    lawyerId: string,
    reason: string,
    ipAddress?: string,
  ): Promise<NotarizedDocument> {
    const doc = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['notarialRegister'],
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    if (doc.notarialRegister.lawyerId !== lawyerId) {
      throw new BadRequestException(
        'You can only revoke your own notarized documents',
      );
    }

    doc.status = DocumentStatus.REVOKED;
    doc.remarks = reason;
    const saved = await this.documentRepository.save(doc);

    await this.auditService.log({
      lawyerId,
      action: AuditAction.DOCUMENT_REVOKED,
      severity: AuditSeverity.WARNING,
      entityType: 'notarized_document',
      entityId: documentId,
      ipAddress,
      description: `Document revoked: ${doc.serialNumber}. Reason: ${reason}`,
    });

    return saved;
  }
}
