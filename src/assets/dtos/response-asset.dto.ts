import { ApiProperty } from "@nestjs/swagger";

import { AssetTypeEnum } from "../../asset_types/entities/asset_type.entity";

export class ShortResponseAssetDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'AAPL' })
  ticker: string;

  @ApiProperty({ example: 'Apple Inc.' })
  name: string;

  @ApiProperty({ example: 'STOCK', enum: AssetTypeEnum })
  type: string
}
