import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { NotaryService } from './notary.service';
import { NotarialRegister, RegisterStatus } from '../../entities/notarial-register.entity';
import {
  NotarizedDocument,
  DocumentStatus,
  DocumentType,
} from '../../entities/notarized-document.entity';
import { DocumentHash } from '../../entities/document-hash.entity';
import { Lawyer, LawyerStatus } from '../../entities/lawyer.entity';
import { AuditService } from '../audit/audit.service';
import { DataSource } from 'typeorm';

describe('NotaryService', () => {
  let service: NotaryService;

  const mockRegisterRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDocumentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockHashRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockLawyerRepository = {
    findOne: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({}),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotaryService,
        {
          provide: getRepositoryToken(NotarialRegister),
          useValue: mockRegisterRepository,
        },
        {
          provide: getRepositoryToken(NotarizedDocument),
          useValue: mockDocumentRepository,
        },
        {
          provide: getRepositoryToken(DocumentHash),
          useValue: mockHashRepository,
        },
        {
          provide: getRepositoryToken(Lawyer),
          useValue: mockLawyerRepository,
        },
        { provide: AuditService, useValue: mockAuditService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<NotaryService>(NotaryService);
    jest.clearAllMocks();
  });

  describe('createRegister', () => {
    const mockLawyer = {
      id: 'lawyer-uuid',
      rollNumber: '12345',
      status: LawyerStatus.ACTIVE,
      fullName: 'Juan Dela Cruz',
    };

    it('should create a notarial register', async () => {
      const dto = { year: 2024, bookNumber: 1 };
      const mockRegister = {
        id: 'reg-uuid',
        lawyerId: 'lawyer-uuid',
        year: 2024,
        bookNumber: 1,
        status: RegisterStatus.ACTIVE,
      };

      mockLawyerRepository.findOne.mockResolvedValue(mockLawyer);
      mockRegisterRepository.findOne.mockResolvedValue(null);
      mockRegisterRepository.create.mockReturnValue(mockRegister);
      mockRegisterRepository.save.mockResolvedValue(mockRegister);

      const result = await service.createRegister('lawyer-uuid', dto);

      expect(result).toEqual(mockRegister);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw ConflictException if register already exists', async () => {
      mockLawyerRepository.findOne.mockResolvedValue(mockLawyer);
      mockRegisterRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createRegister('lawyer-uuid', { year: 2024, bookNumber: 1 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('notarizeDocument', () => {
    const dto = {
      documentType: DocumentType.AFFIDAVIT,
      documentTitle: 'Affidavit of Loss',
      principalName: 'Pedro Penduko',
      notarizationDate: '2024-03-15',
      documentHash: 'a'.repeat(64),
    };

    it('should throw NotFoundException when no active register exists', async () => {
      mockLawyerRepository.findOne.mockResolvedValue({
        id: 'lawyer-uuid',
        rollNumber: '12345',
        status: LawyerStatus.ACTIVE,
      });
      mockHashRepository.findOne.mockResolvedValue(null);
      mockRegisterRepository.findOne.mockResolvedValue(null);

      await expect(
        service.notarizeDocument('lawyer-uuid', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate document hash', async () => {
      mockLawyerRepository.findOne.mockResolvedValue({
        id: 'lawyer-uuid',
        status: LawyerStatus.ACTIVE,
      });
      mockHashRepository.findOne.mockResolvedValue({ id: 'existing-hash' });

      await expect(
        service.notarizeDocument('lawyer-uuid', dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getLawyerDocuments', () => {
    it('should return paginated documents', async () => {
      const mockDocuments = [
        { id: 'doc-1', serialNumber: 'PH012345-2024-001-0001' },
        { id: 'doc-2', serialNumber: 'PH012345-2024-001-0002' },
      ];

      const mockQB = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockDocuments, 2]),
      };
      mockDocumentRepository.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getLawyerDocuments('lawyer-uuid', 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });
  });
});
