import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NotarizedDocument } from '../entities/notarized-document.entity';

@Injectable()
export class NotarizedDocumentDataRepository {
  constructor(
    @InjectRepository(NotarizedDocument)
    private readonly repository: Repository<NotarizedDocument>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<NotarizedDocument> {
    return manager ? manager.getRepository(NotarizedDocument) : this.repository;
  }

  countByRegisterId(registerId: string, manager?: EntityManager) {
    return this.getRepository(manager).count({ where: { registerId } });
  }

  findBySerialNumber(serialNumber: string, manager?: EntityManager) {
    return this.getRepository(manager).findOne({
      where: { serialNumber },
      relations: ['register', 'lawyer', 'hashes'],
    });
  }

  createAndSave(
    payload: Partial<NotarizedDocument>,
    manager?: EntityManager,
  ): Promise<NotarizedDocument> {
    const repository = this.getRepository(manager);
    return repository.save(repository.create(payload));
  }

  findLawyerHistory(lawyerId: string, skip: number, take: number) {
    return this.repository.findAndCount({
      where: { lawyerId },
      order: { notarizedAt: 'DESC' },
      skip,
      take,
      relations: ['hashes', 'register'],
    });
  }
}
