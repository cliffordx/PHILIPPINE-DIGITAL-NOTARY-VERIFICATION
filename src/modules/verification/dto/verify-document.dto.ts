import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationMethod } from '../../../entities/verification-request.entity';

export class VerifyDocumentDto {
  @ApiProperty({
    example: 'PH012345-2024-001-0001',
    description: 'Serial number or SHA-256 hash of the document',
  })
  @IsString()
  queryValue: string;

  @ApiPropertyOptional({
    enum: VerificationMethod,
    default: VerificationMethod.SERIAL_NUMBER,
  })
  @IsOptional()
  @IsEnum(VerificationMethod)
  method?: VerificationMethod;

  @ApiPropertyOptional({ example: 'Registry of Deeds Manila' })
  @IsOptional()
  @IsString()
  requesterName?: string;

  @ApiPropertyOptional({ example: 'Land Registration Authority' })
  @IsOptional()
  @IsString()
  requesterOrganization?: string;
}
