import { User } from 'src/users/entities/user.entity';
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
  baseCoin: string;

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
}
