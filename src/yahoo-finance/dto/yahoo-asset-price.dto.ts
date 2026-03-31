import { ApiProperty } from "@nestjs/swagger";

export class YahooAssetPriceDto {
  @ApiProperty({ description: 'The ticker symbol of the asset', example: 'AAPL' })
  symbol: string;

  @ApiProperty({ description: 'The current price of the asset', example: '150.25' })
  price: string;
}

