import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class VerifyDocumentDto {
  @ApiPropertyOptional({
    example: '42e02c57-0b76-441f-9181-64c239d52f29-RB2026-20260307083000-000001',
  })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({
    example: '7d0f5d5f6d11f8d8e1ab4d6c9c0f6c1476abfdf4bca2d2e7f1f41de9e0db1122',
    minLength: 64,
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @Length(64, 64)
  sha256Hash?: string;
}