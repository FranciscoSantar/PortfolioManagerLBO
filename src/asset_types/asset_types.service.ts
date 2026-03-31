import { In, Repository } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AssetType } from './entities/asset_type.entity';
import { InsertAssetTypeDto } from './dto/insert-asset_type.dto';
import { ASSET_TYPES } from '../seed/data/assets-types-and-assets';
import { handlePostgresError } from '../common/utils/postgres-error-handler';

@Injectable()
export class AssetTypesService {
  constructor(
    @InjectRepository(AssetType)
    private readonly assetTypeRepository: Repository<AssetType>,
  ) { }

  async saveForSeeding(assetTypes: string[]) {
    const isPopulated = await this.checkIfExists()
    if (isPopulated) {
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
    try {
      const assetType = this.assetTypeRepository.findOne({
        where: {
          type
        }
      })

      if (!assetType) {
        throw new NotFoundException(`Asset type ${type} was not found.`)
      }
      return assetType
    } catch (error) {
      handlePostgresError(error)
    }
  }
}
