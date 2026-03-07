import { IsOptional, IsString, Length } from 'class-validator';

export class VerifyDocumentDto {
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @Length(64, 64)
  sha256Hash?: string;
}