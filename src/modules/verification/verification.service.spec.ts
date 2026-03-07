import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import {
  VerificationRequest,
  VerificationStatus,
  VerificationMethod,
} from '../../entities/verification-request.entity';
import {
  NotarizedDocument,
  DocumentStatus,
  DocumentType,
} from '../../entities/notarized-document.entity';
import { DocumentHash } from '../../entities/document-hash.entity';
import { AuditService } from '../audit/audit.service';

describe('VerificationService', () => {
  let service: VerificationService;

  const mockVerificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDocumentRepository = {
    findOne: jest.fn(),
  };

  const mockHashRepository = {
    findOne: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        {
          provide: getRepositoryToken(VerificationRequest),
          useValue: mockVerificationRepository,
        },
        {
          provide: getRepositoryToken(NotarizedDocument),
          useValue: mockDocumentRepository,
        },
        {
          provide: getRepositoryToken(DocumentHash),
          useValue: mockHashRepository,
        },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
    jest.clearAllMocks();
  });

  describe('verifyDocument', () => {
    it('should return NOT_FOUND when document does not exist', async () => {
      mockDocumentRepository.findOne.mockResolvedValue(null);
      mockVerificationRepository.create.mockReturnValue({
        id: 'vr-1',
        status: VerificationStatus.NOT_FOUND,
      });
      mockVerificationRepository.save.mockResolvedValue({
        id: 'vr-1',
        status: VerificationStatus.NOT_FOUND,
        createdAt: new Date(),
      });

      const result = await service.verifyDocument({
        queryValue: 'PH000000-0000-000-0000',
        method: VerificationMethod.SERIAL_NUMBER,
      });

      expect(result.status).toBe(VerificationStatus.NOT_FOUND);
      expect(result.document).toBeUndefined();
    });

    it('should return VERIFIED for a valid document', async () => {
      const mockDoc = {
        id: 'doc-uuid',
        serialNumber: 'PH012345-2024-001-0001',
        documentType: DocumentType.AFFIDAVIT,
        documentTitle: 'Affidavit of Loss',
        principalName: 'Pedro Penduko',
        notarizationDate: new Date(),
        status: DocumentStatus.VALID,
        isFraudFlagged: false,
        notarialRegister: { lawyerId: 'lawyer-uuid' },
        createdAt: new Date(),
      };

      mockDocumentRepository.findOne.mockResolvedValue(mockDoc);
      mockVerificationRepository.create.mockReturnValue({
        id: 'vr-2',
        status: VerificationStatus.VERIFIED,
      });
      mockVerificationRepository.save.mockResolvedValue({
        id: 'vr-2',
        status: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      });

      const result = await service.verifyDocument({
        queryValue: 'PH012345-2024-001-0001',
        method: VerificationMethod.SERIAL_NUMBER,
      });

      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.document).toBeDefined();
      expect(result.document?.serialNumber).toBe('PH012345-2024-001-0001');
    });

    it('should return REVOKED for a revoked document', async () => {
      const mockDoc = {
        id: 'doc-uuid',
        serialNumber: 'PH012345-2024-001-0002',
        status: DocumentStatus.REVOKED,
        isFraudFlagged: false,
        notarialRegister: {},
        createdAt: new Date(),
      };

      mockDocumentRepository.findOne.mockResolvedValue(mockDoc);
      mockVerificationRepository.create.mockReturnValue({ id: 'vr-3' });
      mockVerificationRepository.save.mockResolvedValue({
        id: 'vr-3',
        status: VerificationStatus.REVOKED,
        createdAt: new Date(),
      });

      const result = await service.verifyDocument({
        queryValue: 'PH012345-2024-001-0002',
      });

      expect(result.status).toBe(VerificationStatus.REVOKED);
    });

    it('should return FLAGGED for a fraud-flagged document', async () => {
      const mockDoc = {
        id: 'doc-uuid',
        serialNumber: 'PH012345-2024-001-0003',
        status: DocumentStatus.FLAGGED,
        isFraudFlagged: true,
        notarialRegister: {},
        createdAt: new Date(),
      };

      mockDocumentRepository.findOne.mockResolvedValue(mockDoc);
      mockVerificationRepository.create.mockReturnValue({ id: 'vr-4' });
      mockVerificationRepository.save.mockResolvedValue({
        id: 'vr-4',
        status: VerificationStatus.FLAGGED,
        createdAt: new Date(),
      });

      const result = await service.verifyDocument({
        queryValue: 'PH012345-2024-001-0003',
      });

      expect(result.status).toBe(VerificationStatus.FLAGGED);
    });

    it('should verify by hash using DOCUMENT_HASH method', async () => {
      const mockHash = {
        sha256Hash: 'a'.repeat(64),
        notarizedDocument: {
          id: 'doc-uuid',
          serialNumber: 'PH012345-2024-001-0001',
          status: DocumentStatus.VALID,
          isFraudFlagged: false,
          notarialRegister: {},
          createdAt: new Date(),
        },
      };

      mockHashRepository.findOne.mockResolvedValue(mockHash);
      mockVerificationRepository.create.mockReturnValue({ id: 'vr-5' });
      mockVerificationRepository.save.mockResolvedValue({
        id: 'vr-5',
        status: VerificationStatus.VERIFIED,
        createdAt: new Date(),
      });

      const result = await service.verifyDocument({
        queryValue: 'a'.repeat(64),
        method: VerificationMethod.DOCUMENT_HASH,
      });

      expect(result.status).toBe(VerificationStatus.VERIFIED);
    });
  });

  describe('getVerificationStats', () => {
    it('should return aggregated stats', async () => {
      const mockQB = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: VerificationStatus.VERIFIED, count: '10' },
          { status: VerificationStatus.NOT_FOUND, count: '3' },
        ]),
      };
      mockVerificationRepository.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getVerificationStats();

      expect(result.total).toBe(13);
      expect(result.verified).toBe(10);
      expect(result.notFound).toBe(3);
    });
  });
});
