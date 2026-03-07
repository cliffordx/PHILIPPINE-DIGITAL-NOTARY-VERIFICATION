import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogParams } from '../../common/interfaces/audit-log-params.interface';
import { sha256Hex } from '../../common/utils/hash.util';
import { AuditLogDataRepository } from '../../repositories/audit-log-data.repository';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditLogDataRepository) {}

  async log(params: AuditLogParams) {
    const lastEntry = await this.auditRepository.findLatest();

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

  async getLogs(query: AuditLogQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await this.auditRepository.findPaginated(
      skip,
      limit,
      query.action,
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

  async getLogById(id: string) {
    const item = await this.auditRepository.findById(id);

    if (!item) {
      throw new NotFoundException('Audit log not found');
    }

    return {
      status: 'success',
      data: item,
    };
  }
}