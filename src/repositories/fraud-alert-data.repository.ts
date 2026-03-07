import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FraudAlert } from '../entities/fraud-alert.entity';

@Injectable()
export class FraudAlertDataRepository {
  constructor(
    @InjectRepository(FraudAlert)
    private readonly repository: Repository<FraudAlert>,
  ) {}

  save(payload: Partial<FraudAlert>) {
    return this.repository.save(payload);
  }

  findPaginated(skip: number, take: number, resolved?: boolean) {
    return this.repository.findAndCount({
      where: typeof resolved === 'boolean' ? { resolved } : {},
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }
}
