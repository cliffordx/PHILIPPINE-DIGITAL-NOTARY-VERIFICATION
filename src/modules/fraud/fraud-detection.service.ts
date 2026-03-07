import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  NotarizedDocument,
  DocumentStatus,
} from '../../entities/notarized-document.entity';
import { DocumentHash } from '../../entities/document-hash.entity';
import { Lawyer } from '../../entities/lawyer.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditSeverity } from '../../entities/audit-log.entity';

export interface FraudAlert {
  type:
    | 'excessive_hourly'
    | 'excessive_daily'
    | 'duplicate_hash'
    | 'abnormal_burst';
  lawyerId: string;
  lawyerName: string;
  count: number;
  threshold: number;
  detectedAt: Date;
  documentIds?: string[];
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    @InjectRepository(NotarizedDocument)
    private readonly documentRepository: Repository<NotarizedDocument>,
    @InjectRepository(DocumentHash)
    private readonly hashRepository: Repository<DocumentHash>,
    @InjectRepository(Lawyer)
    private readonly lawyerRepository: Repository<Lawyer>,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async runFraudChecks(): Promise<void> {
    this.logger.log('Running scheduled fraud detection checks...');
    await this.checkExcessiveNotarizations();
    await this.checkDuplicateHashes();
    this.logger.log('Fraud detection checks completed.');
  }

  async checkExcessiveNotarizations(): Promise<FraudAlert[]> {
    const hourlyThreshold = this.configService.get<number>(
      'app.fraudHourlyThreshold',
      20,
    );
    const dailyThreshold = this.configService.get<number>(
      'app.fraudDailyThreshold',
      100,
    );

    const alerts: FraudAlert[] = [];

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check hourly excessive notarizations
    const hourlyStats = await this.documentRepository
      .createQueryBuilder('doc')
      .innerJoin('doc.notarialRegister', 'reg')
      .select('reg.lawyerId', 'lawyerId')
      .addSelect('COUNT(doc.id)', 'count')
      .where('doc.createdAt > :oneHourAgo', { oneHourAgo })
      .andWhere('doc.status != :revoked', { revoked: DocumentStatus.REVOKED })
      .groupBy('reg.lawyerId')
      .having('COUNT(doc.id) >= :threshold', { threshold: hourlyThreshold })
      .getRawMany<{ lawyerId: string; count: string }>();

    for (const stat of hourlyStats) {
      const count = parseInt(stat.count, 10);
      const lawyer = await this.lawyerRepository.findOne({
        where: { id: stat.lawyerId },
      });
      if (lawyer) {
        alerts.push({
          type: 'excessive_hourly',
          lawyerId: stat.lawyerId,
          lawyerName: lawyer.fullName,
          count,
          threshold: hourlyThreshold,
          detectedAt: new Date(),
        });

        await this.flagLawyerDocuments(stat.lawyerId, oneHourAgo, 'excessive_hourly');
        await this.auditService.log({
          lawyerId: stat.lawyerId,
          action: AuditAction.FRAUD_FLAGGED,
          severity: AuditSeverity.CRITICAL,
          entityType: 'lawyer',
          entityId: stat.lawyerId,
          description: `FRAUD ALERT: ${lawyer.fullName} notarized ${count} documents in the last hour (threshold: ${hourlyThreshold})`,
          metadata: { type: 'excessive_hourly', count, threshold: hourlyThreshold },
        });

        this.logger.warn(
          `FRAUD ALERT: Excessive hourly notarizations by ${lawyer.fullName}: ${count}/${hourlyThreshold}`,
        );
      }
    }

    // Check daily excessive notarizations
    const dailyStats = await this.documentRepository
      .createQueryBuilder('doc')
      .innerJoin('doc.notarialRegister', 'reg')
      .select('reg.lawyerId', 'lawyerId')
      .addSelect('COUNT(doc.id)', 'count')
      .where('doc.createdAt > :oneDayAgo', { oneDayAgo })
      .andWhere('doc.status != :revoked', { revoked: DocumentStatus.REVOKED })
      .groupBy('reg.lawyerId')
      .having('COUNT(doc.id) >= :threshold', { threshold: dailyThreshold })
      .getRawMany<{ lawyerId: string; count: string }>();

    for (const stat of dailyStats) {
      const count = parseInt(stat.count, 10);
      const lawyer = await this.lawyerRepository.findOne({
        where: { id: stat.lawyerId },
      });
      if (lawyer) {
        alerts.push({
          type: 'excessive_daily',
          lawyerId: stat.lawyerId,
          lawyerName: lawyer.fullName,
          count,
          threshold: dailyThreshold,
          detectedAt: new Date(),
        });

        await this.auditService.log({
          lawyerId: stat.lawyerId,
          action: AuditAction.FRAUD_FLAGGED,
          severity: AuditSeverity.CRITICAL,
          entityType: 'lawyer',
          entityId: stat.lawyerId,
          description: `FRAUD ALERT: ${lawyer.fullName} notarized ${count} documents today (threshold: ${dailyThreshold})`,
          metadata: { type: 'excessive_daily', count, threshold: dailyThreshold },
        });
      }
    }

    return alerts;
  }

  async checkDuplicateHashes(): Promise<FraudAlert[]> {
    const duplicates = await this.hashRepository
      .createQueryBuilder('dh')
      .select('dh.sha256Hash', 'hash')
      .addSelect('COUNT(dh.id)', 'count')
      .addSelect('ARRAY_AGG(dh.documentId)', 'documentIds')
      .groupBy('dh.sha256Hash')
      .having('COUNT(dh.id) > 1')
      .getRawMany<{ hash: string; count: string; documentIds: string[] }>();

    const alerts: FraudAlert[] = [];
    for (const dup of duplicates) {
      const count = parseInt(dup.count, 10);
      // Get the lawyer from the first document
      const doc = await this.documentRepository.findOne({
        where: { id: dup.documentIds[0] },
        relations: ['notarialRegister'],
      });
      if (doc) {
        const lawyer = await this.lawyerRepository.findOne({
          where: { id: doc.notarialRegister.lawyerId },
        });

        alerts.push({
          type: 'duplicate_hash',
          lawyerId: doc.notarialRegister.lawyerId,
          lawyerName: lawyer?.fullName || 'Unknown',
          count,
          threshold: 1,
          detectedAt: new Date(),
          documentIds: dup.documentIds,
        });

        // Flag all duplicate documents
        await this.documentRepository
          .createQueryBuilder()
          .update(NotarizedDocument)
          .set({
            isFraudFlagged: true,
            fraudReason: `Duplicate document hash detected across ${count} records`,
          })
          .where('id IN (:...ids)', { ids: dup.documentIds })
          .execute();

        await this.auditService.log({
          lawyerId: doc.notarialRegister.lawyerId,
          action: AuditAction.FRAUD_FLAGGED,
          severity: AuditSeverity.CRITICAL,
          description: `FRAUD ALERT: Duplicate hash detected for ${count} documents`,
          metadata: {
            type: 'duplicate_hash',
            hash: dup.hash,
            documentIds: dup.documentIds,
          },
        });

        this.logger.warn(
          `FRAUD ALERT: Duplicate hash found across ${count} documents`,
        );
      }
    }
    return alerts;
  }

  async checkBurstNotarizations(lawyerId: string): Promise<boolean> {
    const burstWindow = this.configService.get<number>(
      'app.fraudBurstWindow',
      300,
    );
    const burstThreshold = this.configService.get<number>(
      'app.fraudBurstThreshold',
      10,
    );

    const windowStart = new Date(Date.now() - burstWindow * 1000);
    const count = await this.documentRepository
      .createQueryBuilder('doc')
      .innerJoin('doc.notarialRegister', 'reg')
      .where('reg.lawyerId = :lawyerId', { lawyerId })
      .andWhere('doc.createdAt > :windowStart', { windowStart })
      .getCount();

    if (count >= burstThreshold) {
      const lawyer = await this.lawyerRepository.findOne({
        where: { id: lawyerId },
      });
      await this.auditService.log({
        lawyerId,
        action: AuditAction.FRAUD_FLAGGED,
        severity: AuditSeverity.WARNING,
        entityType: 'lawyer',
        entityId: lawyerId,
        description: `Burst notarization detected: ${count} in ${burstWindow}s`,
        metadata: { type: 'abnormal_burst', count, threshold: burstThreshold },
      });
      this.logger.warn(
        `BURST ALERT: ${lawyer?.fullName} notarized ${count} documents in ${burstWindow}s`,
      );
      return true;
    }
    return false;
  }

  async getFraudAlerts(
    page = 1,
    limit = 20,
  ): Promise<{ data: NotarizedDocument[]; total: number }> {
    const [data, total] = await this.documentRepository.findAndCount({
      where: { isFraudFlagged: true },
      relations: ['notarialRegister', 'notarialRegister.lawyer'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  private async flagLawyerDocuments(
    lawyerId: string,
    since: Date,
    reason: string,
  ): Promise<void> {
    await this.documentRepository
      .createQueryBuilder()
      .update(NotarizedDocument)
      .set({
        isFraudFlagged: true,
        fraudReason: `Fraud detected: ${reason}`,
        status: DocumentStatus.FLAGGED,
      })
      .where(
        'id IN (SELECT d.id FROM notarized_documents d INNER JOIN notarial_registers r ON d.register_id = r.id WHERE r.lawyer_id = :lawyerId AND d.created_at > :since)',
        { lawyerId, since },
      )
      .execute();
  }
}
