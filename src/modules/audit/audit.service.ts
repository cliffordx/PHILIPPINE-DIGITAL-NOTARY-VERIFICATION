import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sha256Hex } from '../../common/utils/hash.util';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(params: {
    actorId?: string;
    actorRole?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    requestIp?: string;
  }) {
    const lastEntry = await this.auditRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    const previousHash = lastEntry?.entryHash ?? null;

    const payload = JSON.stringify({
      actorId: params.actorId ?? null,
      actorRole: params.actorRole ?? null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      metadata: params.metadata ?? {},
      requestIp: params.requestIp ?? null,
      previousHash,
      timestamp: new Date().toISOString(),
    });

    const entryHash = sha256Hex(payload);

    return this.auditRepository.save({
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: params.metadata ?? {},
      requestIp: params.requestIp,
      previousHash: previousHash ?? undefined,
      entryHash,
    });
  }
}