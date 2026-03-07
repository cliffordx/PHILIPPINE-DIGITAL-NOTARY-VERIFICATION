import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  AuditLog,
  AuditAction,
  AuditSeverity,
} from '../../entities/audit-log.entity';

export interface AuditLogParams {
  lawyerId?: string;
  action: AuditAction;
  severity?: AuditSeverity;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  description?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(params: AuditLogParams): Promise<AuditLog> {
    const previousLog = await this.getLatestLog();
    const previousHash = previousLog?.integrityHash || '0'.repeat(64);

    const integrityHash = this.computeIntegrityHash(params, previousHash);

    const auditLog = this.auditLogRepository.create({
      lawyerId: params.lawyerId,
      action: params.action,
      severity: params.severity || AuditSeverity.INFO,
      entityType: params.entityType,
      entityId: params.entityId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      metadata: params.metadata,
      description: params.description,
      integrityHash,
      previousHash,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    lawyerId?: string,
    action?: AuditAction,
    page = 1,
    limit = 50,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const query = this.auditLogRepository.createQueryBuilder('log');

    if (lawyerId) {
      query.andWhere('log.lawyerId = :lawyerId', { lawyerId });
    }
    if (action) {
      query.andWhere('log.action = :action', { action });
    }

    query
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, total] = await query.getManyAndCount();
    return { logs, total };
  }

  async verifyChainIntegrity(): Promise<{
    isValid: boolean;
    totalLogs: number;
    tamperEvidence?: string;
  }> {
    const logs = await this.auditLogRepository.find({
      order: { createdAt: 'ASC' },
    });

    if (logs.length === 0) {
      return { isValid: true, totalLogs: 0 };
    }

    let previousHash = '0'.repeat(64);
    for (const log of logs) {
      const params: AuditLogParams = {
        lawyerId: log.lawyerId,
        action: log.action,
        severity: log.severity,
        entityType: log.entityType,
        entityId: log.entityId,
        ipAddress: log.ipAddress,
        metadata: log.metadata,
        description: log.description,
      };
      const expectedHash = this.computeIntegrityHash(params, previousHash);
      if (expectedHash !== log.integrityHash) {
        return {
          isValid: false,
          totalLogs: logs.length,
          tamperEvidence: `Log entry ${log.id} at ${log.createdAt} has been tampered`,
        };
      }
      previousHash = log.integrityHash;
    }

    return { isValid: true, totalLogs: logs.length };
  }

  private async getLatestLog(): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });
  }

  private computeIntegrityHash(
    params: AuditLogParams,
    previousHash: string,
  ): string {
    const data = JSON.stringify({
      lawyerId: params.lawyerId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      previousHash,
      timestamp: Date.now(),
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
