import { FindOptionsWhere, Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { PortfolioAsset } from './entities/portfolio-asset.entity';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { YahooFinanceService } from '../yahoo-finance/yahoo-finance.service';
import {
  AssetDataWithCurrentValueDto,
  ResponsePortfolioAssetDto,
  ShortResponsePortfolioAssetDto,
} from './dto/response-portfolio-asset.dto';
import { ShortResponseAssetDto } from '../assets/dtos/response-asset.dto';
import { roundToDecimals } from '../common/utils/float-parser';
import {
  GetPortfolioAssetsQueryParamsDto,
  OrderPortolioAsstesByEnum,
} from '../portfolios/dto/query-params-portfolio.dto';
import { AssetTypeEnum } from '../asset_types/entities/asset_type.entity';
import { YahooAssetPriceDto } from '../yahoo-finance/dto/yahoo-asset-price.dto';

@Injectable()
export class PortfolioAssetsService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(PortfolioAsset)
    private readonly portfolioAssetRepository: Repository<PortfolioAsset>,
    private readonly yahooFinanceService: YahooFinanceService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PortfolioAssetsService.name);
  }

  async findOne(portfolioId: string, assetId: string): Promise<PortfolioAsset> {
    try {
      const portfolioAsset = await this.portfolioAssetRepository.findOne({
        where: {
          portfolio: { id: portfolioId },
          asset: { id: assetId },
        },
        relations: {
          asset: true,
        },
      });

      if (!portfolioAsset) {
        throw new NotFoundException(
          `The asset does not exists in the Portfolio`,
        );
      }

      return portfolioAsset;
    } catch (error: unknown) {
      this.logger.error('Error fetching portfolio asset', {
        portfolioId,
        assetId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }

  async getInfoOfPortfolioAssets(
    portfolioId: string,
    queryDto?: GetPortfolioAssetsQueryParamsDto,
  ): Promise<ResponsePortfolioAssetDto> {
    try {
      let totalInvested = 0;
      let totalCurrentValue = 0;
      const assetsTypesObjectCounter = this.getAssetsTypesCounterObject();

      const portfolioAssets = await this.getPortfolioAssetsByPortfolioId(
        portfolioId,
        queryDto,
      );

      if (portfolioAssets.length === 0) {
        return {
          assets: [],
          totalAssets: 0,
          totalRoi: 0,
          totalInvested: 0,
          totalValue: 0,
        };
      }

      const portfolioAssetsTickers = portfolioAssets.map(
        (portfolioAsset) => portfolioAsset.asset.ticker,
      );

      //Update prices in cache
      await this.yahooFinanceService.updateAllPrices(portfolioAssetsTickers);

      const portfolioAssetDataWithCurrentValueDto: AssetDataWithCurrentValueDto[] =
        await Promise.all(
          portfolioAssets.map(async (portfolioAsset: PortfolioAsset) => {
            const assetInfo: ShortResponseAssetDto = {
              id: portfolioAsset.asset.id,
              name: portfolioAsset.asset.name,
              ticker: portfolioAsset.asset.ticker,
              type: portfolioAsset.asset.assetType.type,
            };

            const assetPriceCacheKey =
              this.yahooFinanceService.getPriceCachingKey(
                portfolioAsset.asset.ticker,
              );
            let portfolioAssetYahooData =
              await this.cacheManager.get<YahooAssetPriceDto>(
                assetPriceCacheKey,
              );

            if (!portfolioAssetYahooData) {
              portfolioAssetYahooData =
                await this.yahooFinanceService.getPriceByTicker(
                  portfolioAsset.asset.ticker,
                );
            }

            const parsedPortfolioAssetCurrentValue = Number(
              portfolioAssetYahooData?.price,
            );
            const parsedPortfolioAssetQuantity = Number(
              portfolioAsset.quantity,
            );
            const parsedAverageBuyPrice = Number(
              portfolioAsset.averageBuyPrice,
            );

            const portfolioAssetTotalInvested =
              parsedAverageBuyPrice * parsedPortfolioAssetQuantity;
            const portfolioAssetTotalValue =
              parsedPortfolioAssetCurrentValue * parsedPortfolioAssetQuantity;
            const portfolioAssetChangePercent =
              ((parsedPortfolioAssetCurrentValue - parsedAverageBuyPrice) /
                parsedAverageBuyPrice) *
              100;

            totalInvested += portfolioAssetTotalInvested;
            totalCurrentValue += portfolioAssetTotalValue;
            assetsTypesObjectCounter[portfolioAsset.asset.assetType.type] += 1;

            return {
              portfolioAssetId: portfolioAsset.id,
              info: assetInfo,
              quantity: roundToDecimals(parsedPortfolioAssetQuantity),
              roi: roundToDecimals(portfolioAssetChangePercent),
              unitPrice: roundToDecimals(parsedPortfolioAssetCurrentValue, 4),
              avgBuyPrice: roundToDecimals(parsedAverageBuyPrice, 4),
              totalValue: roundToDecimals(portfolioAssetTotalValue, 4),
              totalInvested: roundToDecimals(portfolioAssetTotalInvested, 4),
              winLose: roundToDecimals(
                portfolioAssetTotalValue - portfolioAssetTotalInvested,
                4,
              ),
            };
          }),
        );

      const totalChangePercent =
        ((totalCurrentValue - totalInvested) / totalInvested) * 100;
      const response = {
        assets: portfolioAssetDataWithCurrentValueDto,
        totalAssets: portfolioAssets.length,
        totalRoi: roundToDecimals(totalChangePercent),
        totalInvested: roundToDecimals(totalInvested),
        totalValue: roundToDecimals(totalCurrentValue, 4),
        totalWinLose: roundToDecimals(totalCurrentValue - totalInvested, 4),
        assetsDistribution: assetsTypesObjectCounter,
      };

      const orderedResponse = this.orderPortfolioAssets(response, queryDto);

      this.logger.info('Portfolio assets info calculated successfully', {
        portfolioId,
      });

      return orderedResponse;
    } catch (error: unknown) {
      this.logger.error('Error calculating portfolio assets info', {
        portfolioId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }

  async getSummaryOfPortfolio(
    portfolioId: string,
  ): Promise<ShortResponsePortfolioAssetDto> {
    try {
      const portfolioAssets =
        await this.getPortfolioAssetsByPortfolioId(portfolioId);

      if (portfolioAssets.length === 0) {
        this.logger.debug(`No assets found for portfolio`, {
          portfolioId,
        });
        return { totalAssets: 0, totalValue: 0 };
      }

      const portfolioAssetsTickers = portfolioAssets.map(
        (portfolioAsset) => portfolioAsset.asset.ticker,
      );

      //Update prices in cache
      await this.yahooFinanceService.updateAllPrices(portfolioAssetsTickers);

      const portfolioTotalValueAndTotalAssets =
        await this.getPortfolioTotalAssetsAndTotalValue(portfolioAssets);
      return portfolioTotalValueAndTotalAssets;
    } catch (error: unknown) {
      this.logger.error('Error calculating portfolio summary', {
        portfolioId,
        error: error instanceof Error ? error.message : String(error),
      });

      handlePostgresError(error);
    }
  }

  async remove(
    portfolioId: string,
    assetId: string,
    portfolioAssetId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const portfolioAsset = await this.portfolioAssetRepository.findOne({
        where: {
          id: portfolioAssetId,
          portfolio: { id: portfolioId, user: { id: userId } },
          asset: { id: assetId },
        },
      });

      if (!portfolioAsset) {
        this.logger.error(`Attempt to delete non-existing portfolio asset`, {
          portfolioId,
          assetId,
          portfolioAssetId,
          userId,
        });

        throw new NotFoundException(
          `Portfolio Asset with ID = ${portfolioAssetId} does not exist.`,
        );
      }

      await this.portfolioAssetRepository.softRemove(portfolioAsset);
      this.logger.info('Portfolio asset deleted successfully', {
        portfolioAssetId,
        portfolioId,
        assetId,
        userId,
      });
      return true;
    } catch (error: unknown) {
      this.logger.error('Error deleting portfolio asset', {
        portfolioId,
        assetId,
        portfolioAssetId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }

  private async getPortfolioTotalAssetsAndTotalValue(
    portfolioAssets: PortfolioAsset[],
  ): Promise<ShortResponsePortfolioAssetDto> {
    const totalAssets = portfolioAssets.length;
    let totalValue = 0;
    for (const portfolioAsset of portfolioAssets) {
      const assetPriceCacheKey = this.yahooFinanceService.getPriceCachingKey(
        portfolioAsset.asset.ticker,
      );
      const cachedPrice =
        await this.cacheManager.get<YahooAssetPriceDto>(assetPriceCacheKey);
      if (cachedPrice?.price) {
        totalValue +=
          Number(portfolioAsset.quantity) * Number(cachedPrice.price);
      }
    }
    return {
      totalAssets,
      totalValue,
    };
  }

  private async getPortfolioAssetsByPortfolioId(
    portfolioId: string,
    queryDto?: GetPortfolioAssetsQueryParamsDto,
  ): Promise<PortfolioAsset[]> {
    const { filterBy } = queryDto ?? {};

    const where: FindOptionsWhere<PortfolioAsset> = {
      portfolio: { id: portfolioId },
    };

    if (filterBy) {
      where.asset = { assetType: { type: filterBy } };
    }

    const portfolioAssets = await this.portfolioAssetRepository.find({
      where,
      relations: {
        asset: {
          assetType: true,
        },
      },
    });
    return portfolioAssets;
  }

  private orderPortfolioAssets(
    response: ResponsePortfolioAssetDto,
    queryDto?: GetPortfolioAssetsQueryParamsDto,
  ): ResponsePortfolioAssetDto {
    const { orderBy = OrderPortolioAsstesByEnum.VALUE } = queryDto ?? {};
    const sortMap: Record<
      OrderPortolioAsstesByEnum,
      (
        a: AssetDataWithCurrentValueDto,
        b: AssetDataWithCurrentValueDto,
      ) => number
    > = {
      [OrderPortolioAsstesByEnum.VALUE]: (a, b) => b.unitPrice - a.unitPrice,
      [OrderPortolioAsstesByEnum.PERCENTAGE]: (a, b) => b.roi - a.roi,
    };
    response.assets.sort(sortMap[orderBy]);
    return response;
  }

  /* 
    This method is used to create an object with the keys of the different asset types and the values initialized in 0, 
    this is used to count the number of assets of each type in a portfolio for charting purposes.
  */
  private getAssetsTypesCounterObject(): Record<string, number> {
    const assetsTypesObjectCounter: Record<string, number> = {};
    for (const assetType of Object.values(AssetTypeEnum)) {
      assetsTypesObjectCounter[assetType] = 0;
    }
    return assetsTypesObjectCounter;
  }
}
