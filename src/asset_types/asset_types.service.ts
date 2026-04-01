import { In, Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';

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
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AssetTypesService.name);
  }

  async saveForSeeding(assetTypes: string[]) {
    const assetTypesDtos: InsertAssetTypeDto[] = assetTypes.map((type) => ({
      type,
    }));

    const assetTypesEntities = this.assetTypeRepository.create(assetTypesDtos);
    await this.assetTypeRepository.save(assetTypesEntities);

    this.logger.info(
      {
        count: assetTypesEntities.length,
        assetTypes: assetTypesEntities.map((assetType) => assetType.type),
      },
      'Asset types seeded successfully',
    );
  }

  async checkIfExists() {
    return await this.assetTypeRepository.exists({
      where: {
        type: In(ASSET_TYPES),
      },
    });
  }

  async getByType(type: string) {
    try {
      const assetType = await this.assetTypeRepository.findOne({
        where: {
          type,
        },
      });

      if (!assetType) {
        throw new NotFoundException(`Asset type ${type} was not found.`);
      }
      return assetType;
    } catch (error: unknown) {
      this.logger.error(
        {
          type,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error fetching asset type by type',
      );
      handlePostgresError(error);
    }
  }

  async deleteAllForSeeding(): Promise<void> {
    await this.assetTypeRepository.createQueryBuilder().delete().execute();
  }
}
