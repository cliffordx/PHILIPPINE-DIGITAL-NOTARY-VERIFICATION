import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog, AuditAction, AuditSeverity } from '../../entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry with integrity hash', async () => {
      const mockLog = {
        id: 'uuid-1',
        action: AuditAction.LOGIN,
        severity: AuditSeverity.INFO,
        integrityHash: 'abc123',
        createdAt: new Date(),
      };

      mockAuditLogRepository.findOne.mockResolvedValue(null);
      mockAuditLogRepository.create.mockReturnValue(mockLog);
      mockAuditLogRepository.save.mockResolvedValue(mockLog);

      const result = await service.log({
        lawyerId: 'lawyer-id-1',
        action: AuditAction.LOGIN,
        severity: AuditSeverity.INFO,
        description: 'Test login',
      });

      expect(result).toEqual(mockLog);
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN,
          severity: AuditSeverity.INFO,
          integrityHash: expect.any(String),
        }),
      );
      expect(mockAuditLogRepository.save).toHaveBeenCalled();
    });

    it('should use previous hash when chaining entries', async () => {
      const previousLog = {
        id: 'uuid-0',
        integrityHash: 'prev-hash-123abc',
        createdAt: new Date(),
      };

      mockAuditLogRepository.findOne.mockResolvedValue(previousLog);
      mockAuditLogRepository.create.mockImplementation((data) => data);
      mockAuditLogRepository.save.mockImplementation((data) => Promise.resolve({ ...data, id: 'uuid-1' }));

      await service.log({
        action: AuditAction.DOCUMENT_NOTARIZED,
      });

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          previousHash: 'prev-hash-123abc',
        }),
      );
    });

    it('should use zero hash when no previous log exists', async () => {
      mockAuditLogRepository.findOne.mockResolvedValue(null);
      mockAuditLogRepository.create.mockImplementation((data) => data);
      mockAuditLogRepository.save.mockImplementation((data) => Promise.resolve({ ...data, id: 'uuid-1' }));

      await service.log({ action: AuditAction.LOGIN });

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          previousHash: '0'.repeat(64),
        }),
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        { id: 'uuid-1', action: AuditAction.LOGIN },
        { id: 'uuid-2', action: AuditAction.DOCUMENT_NOTARIZED },
      ];
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLogs, 2]),
      };
      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAuditLogs(undefined, undefined, 1, 10);

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('verifyChainIntegrity', () => {
    it('should return valid for an empty log', async () => {
      mockAuditLogRepository.find.mockResolvedValue([]);

      const result = await service.verifyChainIntegrity();

      expect(result.isValid).toBe(true);
      expect(result.totalLogs).toBe(0);
    });
  });
});
