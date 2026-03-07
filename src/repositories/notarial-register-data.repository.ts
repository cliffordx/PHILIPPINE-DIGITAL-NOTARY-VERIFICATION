import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotarialRegister } from '../entities/notarial-register.entity';

@Injectable()
export class NotarialRegisterDataRepository {
  constructor(
    @InjectRepository(NotarialRegister)
    private readonly repository: Repository<NotarialRegister>,
  ) {}

  findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }
}
