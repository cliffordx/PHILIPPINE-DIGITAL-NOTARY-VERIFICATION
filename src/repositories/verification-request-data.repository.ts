import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationRequest } from '../entities/verification-request.entity';

@Injectable()
export class VerificationRequestDataRepository {
  constructor(
    @InjectRepository(VerificationRequest)
    private readonly repository: Repository<VerificationRequest>,
  ) {}

  save(payload: Partial<VerificationRequest>) {
    return this.repository.save(payload);
  }
}
