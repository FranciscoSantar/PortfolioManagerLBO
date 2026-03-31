import { IsEnum, IsNumber, IsNumberString, IsOptional, IsPositive, IsUUID, Matches } from "class-validator";
import { TransactionType } from "../entities/transaction.entity";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export enum CommissionType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  NONE = 'NONE'
}

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsEnum(TransactionType)
  operation: TransactionType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  commission?: number;

  @IsEnum(CommissionType)
  commissionType: CommissionType;

  @IsUUID()
  assetId: string
}
