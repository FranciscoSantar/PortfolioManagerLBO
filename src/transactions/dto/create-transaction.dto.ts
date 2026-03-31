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
  @ApiProperty({ description: 'The quantity of the asset involved in the transaction', example: 10 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: 'The type of the transaction', example: 'BUY', enum: TransactionType })
  @IsEnum(TransactionType)
  operation: TransactionType;

  @ApiProperty({ description: 'The unit price of the asset at the time of the transaction. If not provided, it will be fetched.', example: 150.25, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice?: number;

  @ApiProperty({ description: 'The commission applied to the transaction. If not provided, it will be considered as 0.', example: 5.00, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  commission?: number;

  @ApiProperty({ description: 'The type of commission applied to the transaction. If not provided, it will be considered as NONE.', example: 'FIXED', enum: CommissionType, required: false })
  @IsEnum(CommissionType)
  commissionType: CommissionType;

  @ApiProperty({ description: 'The ID of the asset involved in the transaction', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  assetId: string
}
