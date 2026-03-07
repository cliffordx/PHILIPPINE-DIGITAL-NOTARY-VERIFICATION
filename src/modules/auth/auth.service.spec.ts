import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Lawyer, LawyerRole, LawyerStatus } from '../../entities/lawyer.entity';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockLawyerRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Lawyer), useValue: mockLawyerRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      rollNumber: '12345',
      ibpNumber: 'IBP-001',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'juan@example.com',
      password: 'Str0ng!Pass',
    };

    it('should register a new lawyer successfully', async () => {
      const savedLawyer = {
        id: 'uuid-1',
        ...registerDto,
        passwordHash: 'hashed_password',
        role: LawyerRole.NOTARY,
        status: LawyerStatus.ACTIVE,
        fullName: 'Juan Dela Cruz',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLawyerRepository.findOne.mockResolvedValue(null);
      mockLawyerRepository.create.mockReturnValue(savedLawyer);
      mockLawyerRepository.save.mockResolvedValue(savedLawyer);

      const result = await service.register(registerDto, '127.0.0.1');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.lawyer).toBeDefined();
      expect((result.lawyer as any).passwordHash).toBeUndefined();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw ConflictException if lawyer already exists', async () => {
      mockLawyerRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'juan@example.com', password: 'Str0ng!Pass' };

    const mockLawyer = {
      id: 'uuid-1',
      email: 'juan@example.com',
      passwordHash: 'hashed_password',
      role: LawyerRole.NOTARY,
      status: LawyerStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      fullName: 'Juan Dela Cruz',
    };

    it('should return accessToken on successful login', async () => {
      mockLawyerRepository.findOne.mockResolvedValue(mockLawyer);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockLawyerRepository.save.mockResolvedValue(mockLawyer);

      const result = await service.login(loginDto, '127.0.0.1');

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockLawyerRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockLawyerRepository.findOne.mockResolvedValue(mockLawyer);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockLawyerRepository.save.mockResolvedValue({ ...mockLawyer, failedLoginAttempts: 1 });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for suspended account', async () => {
      mockLawyerRepository.findOne.mockResolvedValue({
        ...mockLawyer,
        status: LawyerStatus.SUSPENDED,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for locked account', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 15);

      mockLawyerRepository.findOne.mockResolvedValue({
        ...mockLawyer,
        lockedUntil: futureDate,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
