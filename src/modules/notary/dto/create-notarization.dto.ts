import {
  IsDateString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateNotarizationDto {
  @IsString()
  registerId!: string;

  @IsString()
  @Length(1, 120)
  documentType!: string;

  @IsString()
  @Length(1, 255)
  principalName!: string;

  @IsString()
  @Length(64, 64)
  sha256Hash!: string;

  @IsOptional()
  @IsString()
  sourceFilename?: string;

  @IsDateString()
  notarizedAt!: string;
}