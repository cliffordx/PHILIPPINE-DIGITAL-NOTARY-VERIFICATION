import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { FraudAnalysisJob } from '../../common/interfaces/fraud-analysis-job.interface';
import { RequestActor } from '../../common/interfaces/request-actor.interface';
import { FraudAlertType } from '../../common/enums/fraud-alert-type.enum';
import { DocumentHashDataRepository } from '../../repositories/document-hash-data.repository';
import { FraudAlertDataRepository } from '../../repositories/fraud-alert-data.repository';
import { NotarizedDocumentDataRepository } from '../../repositories/notarized-document-data.repository';
import { AuditService } from '../audit/audit.service';
import { FraudAlertQueryDto } from './dto/fraud-alert-query.dto';
import { FRAUD_ANALYSIS_QUEUE } from './fraud.constants';

@Injectable()
export class FraudService {
  constructor(
    private readonly configService: ConfigService,
    private readonly alertRepository: FraudAlertDataRepository,
    private readonly documentRepository: NotarizedDocumentDataRepository,
    private readonly hashRepository: DocumentHashDataRepository,
    private readonly auditService: AuditService,
    @InjectQueue(FRAUD_ANALYSIS_QUEUE)
    private readonly fraudQueue: Queue<FraudAnalysisJob>,
  ) {}

  async enqueueAnalysis(job: FraudAnalysisJob) {
    await this.fraudQueue.add('analyze', job, {
      removeOnComplete: 25,
      removeOnFail: 50,
    });
  }

  async handleFraudAnalysis(job: FraudAnalysisJob) {
    const now = new Date(job.notarizedAt);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [hourlyItems] = await this.documentRepository.findLawyerHistory(
      job.lawyerId,
      0,
      500,
    );
    const hourlyCount = hourlyItems.filter(
      (item) => item.notarizedAt > oneHourAgo,
    ).length;
    const dailyCount = hourlyItems.filter(
      (item) => item.notarizedAt > oneDayAgo,
    ).length;

    const duplicateHashCount = await this.hashRepository.countBySha256Hash(
      job.sha256Hash,
    );

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

  async getAlerts(query: FraudAlertQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await this.alertRepository.findPaginated(
      skip,
      limit,
      query.resolved,
    );

    return {
      status: 'success',
      data: {
        page,
        limit,
        total,
        items,
      },
    };
  }

  async resolveAlert(id: string, actor: RequestActor) {
    const alert = await this.alertRepository.findById(id);

    if (!alert) {
      throw new NotFoundException('Fraud alert not found');
    }

    const resolvedAlert = await this.alertRepository.save({
      ...alert,
      resolved: true,
    });

    await this.auditService.log({
      actorId: actor.userId,
      actorRole: actor.role,
      action: 'FRAUD_ALERT_RESOLVED',
      resourceType: 'FRAUD_ALERT',
      resourceId: resolvedAlert.id,
      metadata: {
        resolved: true,
      },
    });

    return {
      status: 'success',
      data: resolvedAlert,
    };
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