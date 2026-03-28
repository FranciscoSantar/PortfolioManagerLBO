import { Injectable } from '@nestjs/common';
import { AssetType } from './entities/asset_type.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InsertAssetTypeDto } from './dto/insert-asset_type.dto';
import { ASSET_TYPES } from 'src/seed/data/assets-types-and-assets';

@Injectable()
export class AssetTypesService {
  constructor(
    @InjectRepository(AssetType)
    private readonly assetTypeRepository: Repository<AssetType>,
  ) { }

  async saveForSeeding(assetTypes: string[]) {
    const isPopulated = await this.checkIfExists()
    if (isPopulated) {
      console.log('Asset Type table is already populated.')
      throw new Error('Asset Type table is already populated.')
    }

    let assetTypesDtos: InsertAssetTypeDto[]
    assetTypesDtos = assetTypes.map((type) => ({
      type
    }))

    const assetTypesEntities = this.assetTypeRepository.create(assetTypesDtos);
    await this.assetTypeRepository.save(assetTypesEntities)
  }

  async checkIfExists() {
    return await this.assetTypeRepository.exists({
      where: {
        type: In(ASSET_TYPES)
      }
    })
  }

  async getByType(type: string) {
    const assetType = this.assetTypeRepository.findOne({
      where: {
        type
      }
    })
    return assetType
  }
}
