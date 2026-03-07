import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../../entities/notarized-document.entity';

export class CreateNotarizationDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.AFFIDAVIT })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ example: 'Affidavit of Loss of Identity Card' })
  @IsString()
  documentTitle: string;

  @ApiProperty({ example: 'Juan Santos Dela Cruz' })
  @IsString()
  principalName: string;

  @ApiPropertyOptional({ example: '123 Mabini St., Ermita, Manila' })
  @IsOptional()
  @IsString()
  principalAddress?: string;

  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  notarizationDate: string;

  @ApiPropertyOptional({ example: '10:30:00' })
  @IsOptional()
  @IsString()
  notarizationTime?: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6...64-char-hex',
    description: 'SHA-256 hash of the document (document is never stored)',
  })
  @IsString()
  documentHash: string;

  @ApiPropertyOptional({ example: 'affidavit-loss.pdf' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 204800 })
  @IsOptional()
  @IsInt()
  @Min(1)
  fileSizeBytes?: number;

  @ApiPropertyOptional({ example: 'Signed in presence of two witnesses.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
