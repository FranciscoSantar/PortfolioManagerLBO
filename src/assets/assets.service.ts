import { Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Asset } from './entities/asset.entity';
import { AssetTypesService } from '../asset_types/asset_types.service';
import { InsertAssetDto } from './dtos/insert-asset.dto';
import { ShortResponseAssetDto } from './dtos/response-asset.dto';
import { YahooFinanceService } from '../yahoo-finance/yahoo-finance.service';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { YahooAssetPriceDto } from '../yahoo-finance/dto/yahoo-asset-price.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly assetTypeService: AssetTypesService,
    private readonly yahooFinanceService: YahooFinanceService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AssetsService.name);
  }

  async findAll(): Promise<ShortResponseAssetDto[]> {
    try {
      const assets = await this.assetRepository.find({
        relations: {
          assetType: true,
        },
      });
      const assetsShortResponseDto = assets.map((asset) =>
        this.toResponseDto(asset),
      );
      return assetsShortResponseDto;
    } catch (error) {
      this.logger.error('Error fetching all assets', {
        error,
      });
      handlePostgresError(error);
    }
  }

  async findOne(id: string): Promise<Asset> {
    try {
      const asset = await this.assetRepository.findOne({
        where: {
          id,
        },
        relations: {
          assetType: true,
        },
      });

      if (!asset) {
        throw new NotFoundException(`Asset with ID = ${id} does not exist.`);
      }
      return asset;
    } catch (error) {
      this.logger.error(`Error fetching asset`, {
        id,
        error,
      });
      handlePostgresError(error);
    }
  }

  async saveForSeeding(
    assetsDTOS: InsertAssetDto[],
    assetType: string,
  ): Promise<void> {
    const stocksAssetType = await this.assetTypeService.getByType(assetType);

    if (!stocksAssetType) {
      this.logger.error('Asset type for seeding assets was not found', {
        assetType,
      });
      throw new Error(`Asset type ${assetType} was not found.`);
    }

    const assetsEntities = assetsDTOS.map((asset) =>
      this.assetRepository.create({
        ...asset,
        assetType: stocksAssetType,
      }),
    );

    await this.assetRepository.save(assetsEntities);
    this.logger.info('Assets seeded successfully during seeding process', {
      count: assetsEntities.length,
      assetType: assetType,
    });
  }

  async updatePrice(ticker: string): Promise<YahooAssetPriceDto> {
    try {
      const asset = await this.assetRepository.findOne({
        where: {
          ticker,
        },
      });
      if (!asset) {
        this.logger.warn(
          `Attempt to update price for non-existing asset with ticker: ${ticker}`,
          {
            ticker,
          },
        );
        throw new NotFoundException(
          `Asset with ticker: ${ticker} does not exist.`,
        );
      }

      const updatePriceSuccess =
        await this.yahooFinanceService.updatePriceByTicker(ticker);
      if (!updatePriceSuccess) {
        this.logger.error(
          `Error during the update of the price of: ${ticker}`,
          {
            ticker,
          },
        );
        throw new InternalServerErrorException(
          `Error during the update of the price of: ${ticker}`,
        );
      }

      this.logger.info(
        `Price updated successfully for asset with ticker: ${ticker}`,
        {
          ticker,
          price: updatePriceSuccess.price,
        },
      );
      return updatePriceSuccess;
    } catch (error) {
      this.logger.error(`Error during the update of the price of: ${ticker}`, {
        ticker,
        error,
      });
      handlePostgresError(error);
    }
  }

  private toResponseDto(asset: Asset): ShortResponseAssetDto {
    const { id, name, ticker, assetType } = asset;
    return {
      id,
      name,
      ticker,
      type: assetType.type,
    };
  }
}
