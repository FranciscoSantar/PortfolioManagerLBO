import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

import { AssetTypeEnum } from '../../asset_types/entities/asset_type.entity';

export enum OrderPortfolioAssetsByEnum {
  VALUE = 'value',
  PERCENTAGE = 'percentage',
}

export class PaginationPortfolioDto {
  @ApiProperty({
    description: 'The number of items to be returned in the response',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageSize: number;

  @ApiProperty({
    description: 'The page number to be returned in the response',
    example: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pageNumber: number;
}

export class GetPortfolioAssetsQueryParamsDto {
  @ApiProperty({
    description: 'Filter assets by their type',
    example: 'STOCK',
    enum: AssetTypeEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(AssetTypeEnum)
  filterBy?: AssetTypeEnum;

  @ApiProperty({
    description: 'Order assets by value or percentage',
    example: 'value',
    enum: OrderPortfolioAssetsByEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderPortfolioAssetsByEnum)
  orderBy?: OrderPortfolioAssetsByEnum;
}
