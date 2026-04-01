import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { PortfolioAsset } from 'src/portfolio-assets/entities/portfolio-asset.entity';

export enum BaseCoin {
  ARS = 'ARS',
  USD = 'USD',
  EUR = 'EUR',
}

@Entity()
@Index(['name', 'user'], { unique: true })
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    name: 'base_coin',
    type: 'enum',
    enum: BaseCoin,
  })
  baseCoin: BaseCoin;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.portfolios)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.portfolio)
  transactions: Transaction[];

  @OneToMany(() => PortfolioAsset, (portfolioAsset) => portfolioAsset.portfolio)
  assets: PortfolioAsset[];
}
