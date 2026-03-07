import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Lawyer, LawyerRole, LawyerStatus } from '../../entities/lawyer.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditSeverity } from '../../entities/audit-log.entity';
import { RegisterLawyerDto } from './dto/register-lawyer.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 15;

  constructor(
    @InjectRepository(Lawyer)
    private readonly lawyerRepository: Repository<Lawyer>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async register(
    dto: RegisterLawyerDto,
    ipAddress?: string,
  ): Promise<{ lawyer: Partial<Lawyer>; accessToken: string }> {
    const existing = await this.lawyerRepository.findOne({
      where: [
        { email: dto.email },
        { rollNumber: dto.rollNumber },
        { ibpNumber: dto.ibpNumber },
      ],
    });
    if (existing) {
      throw new ConflictException(
        'A lawyer with this email, roll number, or IBP number already exists',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
    const lawyer = this.lawyerRepository.create({
      ...dto,
      passwordHash,
      role: dto.role || LawyerRole.NOTARY,
      status: LawyerStatus.ACTIVE,
    });
    const saved = await this.lawyerRepository.save(lawyer);

    await this.auditService.log({
      lawyerId: saved.id,
      action: AuditAction.LAWYER_CREATED,
      severity: AuditSeverity.INFO,
      entityType: 'lawyer',
      entityId: saved.id,
      ipAddress,
      description: `New lawyer registered: ${saved.fullName}`,
    });

    const accessToken = this.generateToken(saved);
    const { passwordHash: _ph, ...lawyerData } = saved;
    return { lawyer: lawyerData, accessToken };
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; lawyer: Partial<Lawyer> }> {
    const lawyer = await this.lawyerRepository.findOne({
      where: { email: dto.email },
    });

    if (!lawyer) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (lawyer.status === LawyerStatus.SUSPENDED) {
      throw new UnauthorizedException('Account has been suspended');
    }

    if (lawyer.lockedUntil && lawyer.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Account locked until ${lawyer.lockedUntil.toISOString()}`,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      lawyer.passwordHash,
    );
    if (!isPasswordValid) {
      lawyer.failedLoginAttempts += 1;
      if (lawyer.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(
          lockedUntil.getMinutes() + this.LOCK_DURATION_MINUTES,
        );
        lawyer.lockedUntil = lockedUntil;
      }
      await this.lawyerRepository.save(lawyer);

      await this.auditService.log({
        lawyerId: lawyer.id,
        action: AuditAction.LOGIN_FAILED,
        severity: AuditSeverity.WARNING,
        entityType: 'lawyer',
        entityId: lawyer.id,
        ipAddress,
        userAgent,
        description: `Failed login attempt for ${lawyer.email}`,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    lawyer.failedLoginAttempts = 0;
    lawyer.lockedUntil = null as unknown as Date;
    lawyer.lastLoginAt = new Date();
    await this.lawyerRepository.save(lawyer);

    await this.auditService.log({
      lawyerId: lawyer.id,
      action: AuditAction.LOGIN,
      severity: AuditSeverity.INFO,
      entityType: 'lawyer',
      entityId: lawyer.id,
      ipAddress,
      userAgent,
      description: `Lawyer ${lawyer.email} logged in`,
    });

    const accessToken = this.generateToken(lawyer);
    const { passwordHash: _ph, ...lawyerData } = lawyer;
    return { accessToken, lawyer: lawyerData };
  }

  async validateLawyer(lawyerId: string): Promise<Lawyer | null> {
    return this.lawyerRepository.findOne({ where: { id: lawyerId } });
  }

  private generateToken(lawyer: Lawyer): string {
    const payload = {
      sub: lawyer.id,
      email: lawyer.email,
      role: lawyer.role,
      rollNumber: lawyer.rollNumber,
    };
    return this.jwtService.sign(payload);
  }
}
