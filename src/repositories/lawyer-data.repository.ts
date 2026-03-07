import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lawyer } from '../entities/lawyer.entity';

@Injectable()
export class LawyerDataRepository {
  constructor(
    @InjectRepository(Lawyer)
    private readonly repository: Repository<Lawyer>,
  ) {}

  findByEmail(email: string) {
    return this.repository.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }
}
