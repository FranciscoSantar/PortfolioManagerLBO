import { IsEnum, IsInt, IsNumberString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AssetTypeEnum } from 'src/asset_types/entities/asset_type.entity';

export enum OrderPortolioAsstesByEnum {
  VALUE = 'value',
  PERCENTAGE = 'percentage'
}


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

export class GetPortfolioAssetsQueryParamsDto {

  @IsOptional()
  @IsEnum(AssetTypeEnum)
  filterBy?: AssetTypeEnum;

  @IsOptional()
  @IsEnum(OrderPortolioAsstesByEnum)
  orderBy?: OrderPortolioAsstesByEnum

}