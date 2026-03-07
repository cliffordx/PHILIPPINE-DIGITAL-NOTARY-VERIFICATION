import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DocumentHash } from '../entities/document-hash.entity';

@Injectable()
export class DocumentHashDataRepository {
  constructor(
    @InjectRepository(DocumentHash)
    private readonly repository: Repository<DocumentHash>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<DocumentHash> {
    return manager ? manager.getRepository(DocumentHash) : this.repository;
  }

  findBySha256Hash(sha256Hash: string) {
    return this.repository.findOne({
      where: { sha256Hash },
      relations: ['document', 'document.lawyer', 'document.register'],
    });
  }

  countBySha256Hash(sha256Hash: string) {
    return this.repository.count({ where: { sha256Hash } });
  }

  createAndSave(payload: Partial<DocumentHash>, manager?: EntityManager) {
    const repository = this.getRepository(manager);
    return repository.save(repository.create(payload));
  }
}
