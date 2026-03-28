import { Transform } from 'class-transformer'; // Used as sanitizer of strings
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Portfolio } from 'src/portfolios/entities/portfolio.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Transform(({ value }) => value.trim()) @Column({ name: 'first_name' })
  firstName: string;

  @Transform(({ value }) => value.trim())
  @Column({ name: 'last_name' })
  lastName: string;

  @Transform(({ value }) => value.trim())
  @Index('unique_email_active_users', ['email'], {
    unique: true,
    where: 'deleted_at IS NULL',
  })
  @Column()
  email: string;

  @Column()
  password: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];
}
