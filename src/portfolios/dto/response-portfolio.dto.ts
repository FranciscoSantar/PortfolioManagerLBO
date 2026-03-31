import { ApiProperty } from '@nestjs/swagger';

export class ShortResponsePortfolioSummaryDto {
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
}
export class ShortPortfolioDto {
  @ApiProperty({
    description: 'The unique identifier of the portfolio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the portfolio',
    example: 'My Investment Portfolio',
  })
  name: string;

  @ApiProperty({
    description: 'Summary of the portfolio',
    type: ShortResponsePortfolioSummaryDto,
  })
  summary: ShortResponsePortfolioSummaryDto;
}

export class ShortResponsePortfolioDto {
  @ApiProperty({
    description: 'List of portfolios with their summaries',
    type: [ShortPortfolioDto],
  })
  data: ShortPortfolioDto[];

  @ApiProperty({ description: 'Total number of pages available', example: 5 })
  totalPages: number;
}

export class ResponseCreatePortfolioDto {
  @ApiProperty({
    description: 'The unique identifier of the portfolio',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the portfolio',
    example: 'My Investment Portfolio',
  })
  name: string;

  @ApiProperty({
    description: 'The base coin of the portfolio',
    example: 'USD',
  })
  baseCoin: string;

  @ApiProperty({
    description: 'A brief description of the portfolio',
    required: false,
  })
  description?: string;
}
