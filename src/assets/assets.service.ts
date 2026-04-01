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
import {
  ResponseFindAllAssetsDto,
  ShortResponseAssetDto,
} from './dtos/response-asset.dto';
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

  async findAll(): Promise<ResponseFindAllAssetsDto> {
    try {
      const assets = await this.assetRepository.find({
        relations: {
          assetType: true,
        },
      });
      const assetsShortResponseDto = assets.map((asset) =>
        this.toResponseDto(asset),
      );
      return { data: assetsShortResponseDto };
    } catch (error: unknown) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Error fetching all assets',
      );
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
    } catch (error: unknown) {
      this.logger.error(
        { id, error: error instanceof Error ? error.message : String(error) },
        'Error fetching asset',
      );
      handlePostgresError(error);
    }
  }

  async saveForSeeding(
    assetsDTOS: InsertAssetDto[],
    assetType: string,
  ): Promise<void> {
    const stocksAssetType = await this.assetTypeService.getByType(assetType);

    if (!stocksAssetType) {
      this.logger.error(
        { assetType },
        'Asset type for seeding assets was not found',
      );
      throw new Error(`Asset type ${assetType} was not found.`);
    }

    const assetsEntities = assetsDTOS.map((asset) =>
      this.assetRepository.create({
        ...asset,
        assetType: stocksAssetType,
      }),
    );

    await this.assetRepository.save(assetsEntities);
    this.logger.info(
      { count: assetsEntities.length, assetType: assetType },
      'Assets seeded successfully during seeding process',
    );
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
          { ticker },
          `Attempt to update price for non-existing asset with ticker: ${ticker}`,
        );
        throw new NotFoundException(
          `Asset with ticker: ${ticker} does not exist.`,
        );
      }

      const updatePriceSuccess =
        await this.yahooFinanceService.updatePriceByTicker(ticker);
      if (!updatePriceSuccess) {
        this.logger.error(
          { ticker },
          `Error during the update of the price of: ${ticker}`,
        );
        throw new InternalServerErrorException(
          `Error during the update of the price of: ${ticker}`,
        );
      }

      this.logger.info(
        { ticker, price: updatePriceSuccess.price },
        `Price updated successfully for asset with ticker: ${ticker}`,
      );
      return updatePriceSuccess;
    } catch (error: unknown) {
      this.logger.error(
        {
          ticker,
          error: error instanceof Error ? error.message : String(error),
        },
        `Error during the update of the price of: ${ticker}`,
      );
      handlePostgresError(error);
    }
  }

  async deleteAllForSeeding(): Promise<void> {
    await this.assetRepository.createQueryBuilder().delete().execute();
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
