import { NotFoundException } from '@nestjs/common';
import { AuditService } from '../src/modules/audit/audit.service';
import { VerificationService } from '../src/modules/verification/verification.service';
import { DocumentHashDataRepository } from '../src/repositories/document-hash-data.repository';
import { NotarizedDocumentDataRepository } from '../src/repositories/notarized-document-data.repository';
import { VerificationRequestDataRepository } from '../src/repositories/verification-request-data.repository';

describe('VerificationService', () => {
  let service: VerificationService;
  let documentRepository: jest.Mocked<NotarizedDocumentDataRepository>;
  let hashRepository: jest.Mocked<DocumentHashDataRepository>;
  let verificationRequestRepository: jest.Mocked<VerificationRequestDataRepository>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(() => {
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
    verificationRequestRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<VerificationRequestDataRepository>;
    auditService = {
      log: jest.fn(),
      getLogs: jest.fn(),
      getLogById: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    service = new VerificationService(
      documentRepository,
      hashRepository,
      verificationRequestRepository,
      auditService,
    );
  });

  it('verifies an existing record by serial number', async () => {
    documentRepository.findBySerialNumber.mockResolvedValue({
      id: 'doc-1',
      serialNumber: 'SERIAL-1',
      documentType: 'AFFIDAVIT OF LOSS',
      principalName: 'Juan Dela Cruz',
      notarizedAt: new Date('2026-03-07T08:30:00.000Z'),
      status: 'ACTIVE',
      lawyer: {
        id: 'lawyer-1',
        fullName: 'Atty. Maria Santos',
        ibpNumber: 'IBP-2026-10001',
      },
    } as never);

    await expect(service.verify({ serialNumber: 'SERIAL-1' }, '127.0.0.1')).resolves
      .toMatchObject({
        status: 'success',
        data: {
          verified: true,
          document: {
            serialNumber: 'SERIAL-1',
          },
        },
      });

    expect(verificationRequestRepository.save).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalled();
  });

  it('throws when document is not found', async () => {
    documentRepository.findBySerialNumber.mockResolvedValue(null);
    hashRepository.findBySha256Hash.mockResolvedValue(null);

    await expect(service.verify({ serialNumber: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});