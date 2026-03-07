import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogDataRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  findLatest() {
    return this.repository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });
  }

  save(payload: Partial<AuditLog>) {
    return this.repository.save(payload);
  }

  findPaginated(skip: number, take: number, action?: string) {
    return this.repository.findAndCount({
      where: action ? { action } : {},
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }
}
