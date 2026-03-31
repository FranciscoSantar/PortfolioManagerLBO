import { Transform } from 'class-transformer';
import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { BaseCoin } from '../entities/portfolio.entity';

export class UpdatePortfolioDto {
  @ApiProperty({
    description: 'The name of the portfolio',
    example: 'My Investment Portfolio',
  })
  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'The base coin of the portfolio',
    example: 'USD',
    enum: BaseCoin,
  })
  @Transform(({ value }) => value.trim())
  @IsEnum(BaseCoin)
  baseCoin: BaseCoin;

  @ApiProperty({
    description: 'A brief description of the portfolio',
    required: false,
  })
  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  @MinLength(3)
  description?: string;
}
