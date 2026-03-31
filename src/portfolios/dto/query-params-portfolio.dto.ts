import {
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetTypeEnum } from 'src/asset_types/entities/asset_type.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderPortolioAsstesByEnum {
  VALUE = 'value',
  PERCENTAGE = 'percentage',
}

export class PagintionPortfolioDto {
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
    enum: OrderPortolioAsstesByEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderPortolioAsstesByEnum)
  orderBy?: OrderPortolioAsstesByEnum;
}
