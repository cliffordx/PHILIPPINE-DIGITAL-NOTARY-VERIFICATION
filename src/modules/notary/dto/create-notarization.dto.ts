import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateNotarizationDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  registerId!: string;

  @ApiProperty({ example: 'AFFIDAVIT OF LOSS', maxLength: 120 })
  @IsString()
  @Length(1, 120)
  documentType!: string;

  @ApiProperty({ example: 'Juan Dela Cruz', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  principalName!: string;

  @ApiProperty({
    example: '7d0f5d5f6d11f8d8e1ab4d6c9c0f6c1476abfdf4bca2d2e7f1f41de9e0db1122',
    minLength: 64,
    maxLength: 64,
  })
  @IsString()
  @Length(64, 64)
  sha256Hash!: string;

  @ApiPropertyOptional({ example: 'affidavit-of-loss.pdf' })
  @IsOptional()
  @IsString()
  sourceFilename?: string;

  @ApiProperty({ example: '2026-03-07T08:30:00.000Z' })
  @IsDateString()
  notarizedAt!: string;
}