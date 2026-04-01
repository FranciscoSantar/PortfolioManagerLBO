import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AssetType } from '../../asset_types/entities/asset_type.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { PortfolioAsset } from '../../portfolio-assets/entities/portfolio-asset.entity';

@Entity()
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  ticker: string;

  @Column({
    unique: true,
  })
  name: string;

  @Column()
  exchange: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AssetType)
  @JoinColumn({ name: 'type_id' })
  assetType: AssetType;

  @OneToMany(() => Transaction, (transaction) => transaction.asset)
  transactions: Transaction[];

  @OneToMany(() => PortfolioAsset, (portfolioAsset) => portfolioAsset.asset)
  portfolioAsset: PortfolioAsset[];
}
