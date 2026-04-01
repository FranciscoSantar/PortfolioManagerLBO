import { ApiProperty } from '@nestjs/swagger';
import { ShortResponseAssetDto } from 'src/assets/dtos/response-asset.dto';

export class ShortResponsePortfolioAssetDto {
  @ApiProperty({
    description: 'Total number of assets in the portfolio',
    example: 5,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Total current of the portfolio',
    example: 10000,
  })
  totalValue: number;
}

export class AssetDataWithCurrentValueDto {
  @ApiProperty({
    description: 'The id of the portfolio asset',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  portfolioAssetId: string;

  @ApiProperty({
    description: 'Information about the asset',
    type: ShortResponseAssetDto,
  })
  info: ShortResponseAssetDto;

  @ApiProperty({
    description: 'The total value of the asset in the portfolio',
    example: 5000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'The total invested amount in the asset',
    example: 4500,
  })
  totalInvested: number;

  @ApiProperty({ description: 'The quantity of the asset', example: 10 })
  quantity: number;

  @ApiProperty({
    description: 'The current unit price of the asset',
    example: 500,
  })
  unitPrice: number;

  @ApiProperty({
    description: 'The return on investment (ROI) of the asset',
    example: 10,
  })
  roi: number;

  @ApiProperty({
    description: 'The average buy price of the asset',
    example: 450,
  })
  avgBuyPrice: number;
}

export class ResponsePortfolioAssetDto {
  @ApiProperty({
    description: 'List of assets in the portfolio with their current values',
    type: [AssetDataWithCurrentValueDto],
  })
  assets: AssetDataWithCurrentValueDto[];
  @ApiProperty({
    description: 'Total number of assets in the portfolio',
    example: 5,
  })
  totalAssets: number;

  @ApiProperty({
    description: 'Total current value of the portfolio',
    example: 10000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Total invested amount in the portfolio',
    example: 8000,
  })
  totalInvested: number;

  @ApiProperty({
    description: 'Total return on investment (ROI) of the portfolio',
    example: 25,
  })
  totalRoi: number;
}
