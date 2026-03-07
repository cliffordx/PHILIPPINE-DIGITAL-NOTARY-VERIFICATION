import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LawyerRole } from '../../../entities/lawyer.entity';

export class RegisterLawyerDto {
  @ApiProperty({ example: '12345' })
  @IsString()
  rollNumber: string;

  @ApiProperty({ example: 'IBP-XII-23456' })
  @IsString()
  ibpNumber: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Dela Cruz' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'Santos' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'juan.delacruz@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ng!Pass#2024', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: LawyerRole, default: LawyerRole.NOTARY })
  @IsOptional()
  @IsEnum(LawyerRole)
  role?: LawyerRole;

  @ApiPropertyOptional({ example: 'NCN-2024-001' })
  @IsOptional()
  @IsString()
  notarialCommissionNumber?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  commissionStartDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  commissionEndDate?: string;

  @ApiPropertyOptional({ example: 'City of Manila' })
  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @ApiPropertyOptional({ example: 'Dela Cruz & Associates' })
  @IsOptional()
  @IsString()
  lawFirm?: string;

  @ApiPropertyOptional({ example: '123 Rizal Ave., Manila' })
  @IsOptional()
  @IsString()
  officeAddress?: string;

  @ApiPropertyOptional({ example: '+63-2-1234-5678' })
  @IsOptional()
  @IsString()
  contactNumber?: string;
}
