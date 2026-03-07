import { ConfigService } from '@nestjs/config';
import { Role } from '../src/common/enums/role.enum';
import { FraudAlertDataRepository } from '../src/repositories/fraud-alert-data.repository';
import { DocumentHashDataRepository } from '../src/repositories/document-hash-data.repository';
import { NotarizedDocumentDataRepository } from '../src/repositories/notarized-document-data.repository';
import { AuditService } from '../src/modules/audit/audit.service';
import { FraudService } from '../src/modules/fraud/fraud.service';

describe('FraudService', () => {
  let service: FraudService;
  let alertRepository: jest.Mocked<FraudAlertDataRepository>;
  let documentRepository: jest.Mocked<NotarizedDocumentDataRepository>;
  let hashRepository: jest.Mocked<DocumentHashDataRepository>;
  let auditService: jest.Mocked<AuditService>;
  let fraudQueue: { add: jest.Mock };

  beforeEach(() => {
    alertRepository = {
      save: jest.fn(),
      findPaginated: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<FraudAlertDataRepository>;
    documentRepository = {
      countByRegisterId: jest.fn(),
      findBySerialNumber: jest.fn(),
      createAndSave: jest.fn(),
      findLawyerHistory: jest.fn(),
    } as unknown as jest.Mocked<NotarizedDocumentDataRepository>;
    hashRepository = {
      findBySha256Hash: jest.fn(),
      countBySha256Hash: jest.fn(),
      createAndSave: jest.fn(),
    } as unknown as jest.Mocked<DocumentHashDataRepository>;
    auditService = {
      log: jest.fn(),
      getLogs: jest.fn(),
      getLogById: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;
    fraudQueue = {
      add: jest.fn(),
    };

    service = new FraudService(
      {
        get: jest.fn((key: string, fallback: number) => fallback),
      } as unknown as ConfigService,
      alertRepository,
      documentRepository,
      hashRepository,
      auditService,
      fraudQueue as never,
    );
  });

  it('queues fraud analysis jobs', async () => {
    await service.enqueueAnalysis({
      lawyerId: 'lawyer-1',
      documentId: 'doc-1',
      sha256Hash: 'hash',
      notarizedAt: '2026-03-07T08:30:00.000Z',
    });

    expect(fraudQueue.add).toHaveBeenCalledWith(
      'analyze',
      expect.objectContaining({ lawyerId: 'lawyer-1' }),
      expect.any(Object),
    );
  });

  it('resolves an alert and writes an audit log', async () => {
    alertRepository.findById.mockResolvedValue({
      id: 'alert-1',
      resolved: false,
    } as never);
    alertRepository.save.mockResolvedValue({
      id: 'alert-1',
      resolved: true,
    } as never);

    await expect(
      service.resolveAlert('alert-1', {
        userId: 'auditor-1',
        email: 'auditor@ibp.example.ph',
        role: Role.AUDITOR,
        ibpNumber: 'IBP-2026-90002',
      }),
    ).resolves.toMatchObject({
      status: 'success',
      data: { id: 'alert-1', resolved: true },
    });

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'FRAUD_ALERT_RESOLVED' }),
    );
  });
});
