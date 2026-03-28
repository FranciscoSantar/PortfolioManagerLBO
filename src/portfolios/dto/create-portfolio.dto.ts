import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer'; // Used as sanitizer of strings

import { BaseCoin } from '../entities/portfolio.entity';

export class CreatePortfolioDto {
  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(3)
  name: string;

  @Transform(({ value }) => value.trim())
  @IsEnum(BaseCoin)
  baseCoin: BaseCoin;

  @Transform(({ value }) => value.trim())
  @IsString()
  @IsOptional()
  @MinLength(3)
  description?: string;

  @IsString()
  userId: string;
}
