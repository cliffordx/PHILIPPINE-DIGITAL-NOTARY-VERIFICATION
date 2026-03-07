import { IsInt, IsPositive, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegisterDto {
  @ApiPropertyOptional({
    example: 2024,
    description: 'Year of the register. Defaults to current year.',
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Book number. Defaults to 1.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  bookNumber?: number;

  @ApiPropertyOptional({
    example: 500,
    description: 'Maximum entries allowed. Defaults to 500.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  maxEntries?: number;
}
