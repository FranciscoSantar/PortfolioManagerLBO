import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Portfolio } from "../../portfolios/entities/portfolio.entity";
import { Asset } from "../../assets/entities/asset.entity";

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL'
}

@Entity()
export class Transaction {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 6
  })
  quantity: string;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: TransactionType
  })

  operation: TransactionType

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    name: 'unit_price'
  })
  unitPrice: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    default: '0',

  })
  commissionAmount: string

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.transactions)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @ManyToOne(() => Asset, (asset) => asset.transactions)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;
}
