import { Injectable, NotFoundException } from '@nestjs/common';
import { Asset } from './entities/asset.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetTypesService } from 'src/asset_types/asset_types.service';
import { InsertAssetDto } from './dtos/insert-asset.dto';
import { ASSET_TYPES } from 'src/seed/data/assets-types-and-assets';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly assetTypeService: AssetTypesService
  ) { }

  async findOne(id: string) {
    const asset = await this.assetRepository.findOne({
      where: {
        id: id
      }
    })

    if (!asset) {
      throw new NotFoundException(`Asset with id ${id} was not found.`);
    }

    return asset;

  }

  async saveForSeeding(assetsDTOS: InsertAssetDto[], assetType: string) {
    const stocksAssetType = await this.assetTypeService.getByType(assetType)

    if (!stocksAssetType) {
      console.log(`Asset type ${assetType} was not found.`);
      throw new Error(`Asset type ${assetType} was not found.`)
    }

    const assetsEntities = assetsDTOS.map((asset) =>
      this.assetRepository.create({
        ...asset,
        assetType: stocksAssetType
      }))

    await this.assetRepository.save(assetsEntities)

  }
}
