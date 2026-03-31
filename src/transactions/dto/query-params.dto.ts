import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { TransactionType } from "../entities/transaction.entity";

export class FilterTransactionsByDto {
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType

  @IsOptional()
  @IsDateString()
  fromDate?: string

  @IsOptional()
  @IsDateString()
  toDate?: string
}