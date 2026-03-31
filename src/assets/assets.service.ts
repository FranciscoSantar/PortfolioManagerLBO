import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Asset } from './entities/asset.entity';
import { Repository } from 'typeorm';
import { AssetTypesService } from 'src/asset_types/asset_types.service';
import { InsertAssetDto } from './dtos/insert-asset.dto';
import { ShortResponseAssetDto } from './dtos/response-asset.dto';
import { YahooFinanceService } from 'src/yahoo-finance/yahoo-finance.service';
import { handlePostgresError } from 'src/common/utils/postgres-error-handler';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly assetTypeService: AssetTypesService,
    private readonly yahooFinanceService: YahooFinanceService
  ) { }

  async findAll() {
    const assets = await this.assetRepository.find({
      relations: {
        assetType: true
      }
    })
    const assetsShortResponseDto = assets.map((asset) => this.toResponseDto(asset))
    return assetsShortResponseDto;
  }

  async findOne(id: string) {
    const asset = await this.assetRepository.findOne({
      where: {
        id
      }
    })

    if (!asset) {
      throw new NotFoundException(`Asset with id ${id} was not found.`);
    }

    //TODO: Implement LongResponseDto with stock and crypto tables
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

  async updatePrice(ticker: string) {
    try {
      const asset = await this.assetRepository.findOne({
        where: {
          ticker
        }
      })
      if (!asset) {
        throw new NotFoundException(`Asset with ticker: ${ticker} does not exists.`)
      }

      const updatePriceSuccess = await this.yahooFinanceService.updatePriceByTicker(ticker)
      if (!updatePriceSuccess) {
        throw new InternalServerErrorException(`Error during the update of the price of: ${ticker}`)
      }
      return true
    } catch (error) {
      handlePostgresError(error)
    }
  }

  private toResponseDto(asset: Asset): ShortResponseAssetDto {
    const { id, name, ticker, assetType } = asset
    return {
      id,
      name,
      ticker,
      type: assetType.type
    }
  }
}
