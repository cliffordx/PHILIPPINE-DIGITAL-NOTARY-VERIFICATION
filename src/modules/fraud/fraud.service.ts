import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { FraudAlertType } from '../../common/enums/fraud-alert-type.enum';
import { DocumentHash } from '../../entities/document-hash.entity';
import { FraudAlert } from '../../entities/fraud-alert.entity';
import { NotarizedDocument } from '../../entities/notarized-document.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FraudService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FraudAlert)
    private readonly alertRepository: Repository<FraudAlert>,
    @InjectRepository(NotarizedDocument)
    private readonly documentRepository: Repository<NotarizedDocument>,
    @InjectRepository(DocumentHash)
    private readonly hashRepository: Repository<DocumentHash>,
    private readonly auditService: AuditService,
  ) {}

  async enqueueAnalysis(job: {
    lawyerId: string;
    documentId: string;
    sha256Hash: string;
    notarizedAt: string;
  }) {
    await this.runFraudChecks(job);
  }

  private async runFraudChecks(job: {
    lawyerId: string;
    documentId: string;
    sha256Hash: string;
    notarizedAt: string;
  }) {
    const now = new Date(job.notarizedAt);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const hourlyCount = await this.documentRepository.count({
      where: {
        lawyerId: job.lawyerId,
        notarizedAt: MoreThan(oneHourAgo),
      },
    });

    const dailyCount = await this.documentRepository.count({
      where: {
        lawyerId: job.lawyerId,
        notarizedAt: MoreThan(oneDayAgo),
      },
    });

    const duplicateHashCount = await this.hashRepository.count({
      where: { sha256Hash: job.sha256Hash },
    });

    const hourlyThreshold = this.configService.get<number>(
      'FRAUD_HOURLY_THRESHOLD',
      30,
    );
    const dailyThreshold = this.configService.get<number>(
      'FRAUD_DAILY_THRESHOLD',
      200,
    );

    if (hourlyCount > hourlyThreshold) {
      await this.createAlert(
        job.lawyerId,
        FraudAlertType.EXCESSIVE_HOURLY_ACTIVITY,
        'HIGH',
        { hourlyCount, threshold: hourlyThreshold },
      );
    }

    if (dailyCount > dailyThreshold) {
      await this.createAlert(
        job.lawyerId,
        FraudAlertType.EXCESSIVE_DAILY_ACTIVITY,
        'HIGH',
        { dailyCount, threshold: dailyThreshold },
      );
    }

    if (duplicateHashCount > 1) {
      await this.createAlert(
        job.lawyerId,
        FraudAlertType.DUPLICATE_DOCUMENT_HASH,
        'MEDIUM',
        { sha256Hash: job.sha256Hash, duplicateHashCount },
      );
    }
  }

  private async createAlert(
    lawyerId: string,
    alertType: FraudAlertType,
    severity: string,
    details: Record<string, unknown>,
  ) {
    const alert = await this.alertRepository.save({
      lawyerId,
      alertType,
      severity,
      details,
      resolved: false,
    });

    await this.auditService.log({
      actorId: lawyerId,
      actorRole: 'SYSTEM',
      action: 'FRAUD_ALERT_CREATED',
      resourceType: 'FRAUD_ALERT',
      resourceId: alert.id,
      metadata: details,
    });

    return alert;
  }
}