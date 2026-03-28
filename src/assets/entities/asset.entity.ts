import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AssetType } from '../../asset_types/entities/asset_type.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity()
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true
  })
  ticker: string;

  @Column({
    unique: true
  })
  name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4
  })
  price: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => AssetType)
  @JoinColumn({ name: 'type_id' })
  assetType: AssetType;

  @OneToMany(() => Transaction, (transaction) => transaction.asset)
  transactions: Transaction[];
}
