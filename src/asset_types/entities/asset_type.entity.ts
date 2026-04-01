import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Asset } from '../../assets/entities/asset.entity';

export enum AssetTypeEnum {
  STOCK = 'STOCK',
  CRYPTO = 'CRYPTO',
}

@Entity()
export class AssetType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  type: string;

  @OneToMany(() => Asset, (asset) => asset.assetType, { onDelete: 'CASCADE' })
  assets: Asset[];
}
