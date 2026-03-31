import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { TransactionType } from "../entities/transaction.entity";
import { ApiProperty } from "@nestjs/swagger";

export class FilterTransactionsByDto {
  @ApiProperty({ description: 'The type of the transaction to filter by', example: 'BUY', enum: TransactionType, required: false })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType

  @ApiProperty({ description: 'The start date to filter transactions from', example: '2023-01-01', type: Date, required: false })
  @IsOptional()
  @IsDateString()
  fromDate?: string

  @ApiProperty({ description: 'The end date to filter transactions to', example: '2023-12-31', type: Date, required: false })
  @IsOptional()
  @IsDateString()
  toDate?: string
}