import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../src/common/enums/role.enum';
import { Lawyer } from '../src/entities/lawyer.entity';
import { AuthService } from '../src/modules/auth/auth.service';
import { LawyerDataRepository } from '../src/repositories/lawyer-data.repository';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let lawyerRepository: jest.Mocked<LawyerDataRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    lawyerRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<LawyerDataRepository>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as jest.Mocked<JwtService>;

    service = new AuthService(lawyerRepository, jwtService);
  });

  it('returns token payload for valid credentials', async () => {
    const user = {
      id: 'lawyer-1',
      email: 'notary1@ibp.example.ph',
      role: Role.NOTARY,
      ibpNumber: 'IBP-2026-10001',
      fullName: 'Atty. Maria Santos',
      passwordHash: 'hashed-password',
    } as Lawyer;

    lawyerRepository.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login('notary1@ibp.example.ph', 'ChangeMe123!'),
    ).resolves.toEqual({
      accessToken: 'signed-token',
      user: {
        id: 'lawyer-1',
        email: 'notary1@ibp.example.ph',
        role: Role.NOTARY,
        fullName: 'Atty. Maria Santos',
        ibpNumber: 'IBP-2026-10001',
      },
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'lawyer-1',
      email: 'notary1@ibp.example.ph',
      role: Role.NOTARY,
      ibpNumber: 'IBP-2026-10001',
    });
  });

  it('throws for invalid credentials', async () => {
    lawyerRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.validateUser('missing@ibp.example.ph', 'ChangeMe123!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});