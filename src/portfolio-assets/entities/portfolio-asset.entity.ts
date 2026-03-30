import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Asset } from '../../assets/entities/asset.entity';
import { Portfolio } from '../../portfolios/entities/portfolio.entity';

@Entity()
@Index(['asset', 'portfolio'], { unique: true })
export class PortfolioAsset {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 6
  })
  quantity: string;

  @Column({
    name: 'avg_buy_price',
    type: 'decimal',
    precision: 12,
    scale: 4
  })
  averageBuyPrice: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.assets)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @ManyToOne(() => Asset, (asset) => asset.portfolioAsset)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;
}

