import { IsEnum, IsNumberString, IsOptional, IsUUID, Matches } from "class-validator";
import { CommissionType, TransactionType } from "../entities/transaction.entity";
import { Transform } from "class-transformer";

export class CreateTransactionDto {
  @IsNumberString()
  @Transform(({ value }) => value.trim())
  @Matches(/^[^-].*/, { message: 'quantity should be a positive number' })
  quantity: string;

  @IsEnum(TransactionType)
  operation: TransactionType;

  @IsOptional()
  @IsNumberString()
  @Matches(/^[^-].*/, { message: 'unitPrice should be a positive number' })
  unitPrice?: string;

  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsNumberString()
  @Matches(/^[^-].*/, { message: 'commission should be a positive number' })
  commission?: string;

  @IsEnum(CommissionType)
  commissionType: CommissionType;

  @IsUUID()
  assetId: string
}
