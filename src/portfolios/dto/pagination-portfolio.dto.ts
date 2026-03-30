import { IsInt, IsNumberString, IsOptional, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';


export class PagintionPortfolioDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageSize: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageNumber: number;
}
