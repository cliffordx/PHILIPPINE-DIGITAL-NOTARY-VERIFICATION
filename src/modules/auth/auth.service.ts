import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Lawyer } from '../../entities/lawyer.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Lawyer)
    private readonly lawyerRepository: Repository<Lawyer>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<Lawyer> {
    const user = await this.lawyerRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      ibpNumber: user.ibpNumber,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        ibpNumber: user.ibpNumber,
      },
    };
  }
}