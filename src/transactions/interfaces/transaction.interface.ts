import { Asset } from '../../assets/entities/asset.entity';
import { Transaction } from '../entities/transaction.entity';

export interface AllTransactionsOfPortfolioAsset {
  transactions: Transaction[];
  asset: Asset;
}
