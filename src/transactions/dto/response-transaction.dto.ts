import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "../entities/transaction.entity";
import { ShortResponseAssetDto } from "../../assets/dtos/response-asset.dto";

export class ShortResponseTransactionDto {
  @ApiProperty({ description: 'Transaction Id', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'The quantity of the asset involved in the transaction', example: 10 })
  quantity: number;

  @ApiProperty({ description: 'The type of the transaction', example: 'BUY', enum: TransactionType })
  operation: TransactionType;

  @ApiProperty({ description: 'The unit price of the asset at the time of the transaction', example: 150.25 })
  unitPrice: number;

  @ApiProperty({ description: 'The value of the commission applied to the transaction', example: 5.00 })
  commission?: number;
}

export class ResponseTransactionsWithTotalCommissionDto {
  @ApiProperty({ description: 'List of transactions', type: [ShortResponseTransactionDto] })
  transactions: ShortResponseTransactionDto[];

  @ApiProperty({ description: 'The total commission amount for the listed transactions', example: 25.00 })
  totalCommission: number;
}

export class ResponseAllTransactionsOfPortfolioAssetDto {
  @ApiProperty({ description: 'List of transactions for the specified asset in the portfolio', type: [ShortResponseTransactionDto] })
  transactions: ShortResponseTransactionDto[];

  @ApiProperty({ type: ShortResponseAssetDto })
  asset: ShortResponseAssetDto
}