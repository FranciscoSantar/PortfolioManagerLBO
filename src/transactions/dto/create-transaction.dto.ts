import { IsEnum, IsNumberString, IsOptional, IsUUID, Matches } from "class-validator";
import { TransactionType } from "../entities/transaction.entity";
import { Transform } from "class-transformer";

export class CreateTransactionDto {
  @IsNumberString()
  @Matches(/^[^-].*/, { message: 'quantity should be a positive number' })
  quantity: string;

  @IsEnum(TransactionType)
  operation: TransactionType;

  @IsNumberString()
  @Matches(/^[^-].*/, { message: 'unitPrice should be a positive number' })
  unitPrice: string;

  @IsOptional()
  @IsNumberString()
  @Matches(/^[^-].*/, { message: 'comission should be a positive number' })
  comission?: string;

  @IsUUID()
  assetId: string
}
