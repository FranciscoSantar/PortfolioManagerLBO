import { TransactionType } from "../entities/transaction.entity";

export class ShortResponseTransactionDto {

  id: string;
  quantity: string;
  operation: TransactionType;
  unitPrice: string;
  commission?: string;
}
