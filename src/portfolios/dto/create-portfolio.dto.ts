import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer'; // Used as sanitizer of strings

import { BaseCoin } from '../entities/portfolio.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePortfolioDto {
  @ApiProperty({
    description: 'The name of the portfolio',
    example: 'My Investment Portfolio',
  })
  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'The base coin of the portfolio',
    example: 'USD',
    enum: BaseCoin,
  })
  @Transform(({ value }: { value: string }) => value.trim())
  @IsEnum(BaseCoin)
  baseCoin: BaseCoin;

  @ApiProperty({
    description: 'A brief description of the portfolio',
    required: false,
  })
  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @IsOptional()
  @MinLength(3)
  description?: string;
}
