
export class ShortResponsePortfolioSummaryDto {
  totalAssets: number;
  totalValue: number;
}
export class ShortResponsePortfolioDto {
  id: string;
  name: string;
  summary: ShortResponsePortfolioSummaryDto
}

export class ShortResponseDto {
  data: ShortResponsePortfolioDto[];
  totalPages: number;
}