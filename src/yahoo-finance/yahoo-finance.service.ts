import YahooFinance from 'yahoo-finance2';
import { PinoLogger } from 'nestjs-pino';

import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

import { ShortAssetYahooFinance } from './interfaces/asset-yahoo-finance.interface';
import { InsertAssetDto } from '../assets/dtos/insert-asset.dto';
import { YahooAssetPriceDto } from './dto/yahoo-asset-price.dto';

@Injectable()
export class YahooFinanceService {
  private readonly yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  private readonly BATCH_SIZE = 20;
  private readonly PRICE_CACHE_TTL = 1000 * 60 * 5;

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(YahooFinanceService.name);
  }
  async getDataForSeeding(assetList: string[]): Promise<InsertAssetDto[]> {
    let yahooFinanceShortData: ShortAssetYahooFinance[] = [];

    const data = await this.fetchYahooFinance(assetList);
    const formattedData: ShortAssetYahooFinance[] = data.map((assetData) => ({
      symbol: assetData.symbol,
      longName: assetData.longName,
      exchange: assetData.exchange,
      currency: assetData.currency,
      marketState: assetData.marketState,
    }));
    yahooFinanceShortData.push(...formattedData);

    const insertAssetsDtos: InsertAssetDto[] = this.toInsertAssetDto(
      yahooFinanceShortData,
    );
    return insertAssetsDtos;
  }

  async getPriceByTicker(ticker: string): Promise<YahooAssetPriceDto> {
    const assetPriceCacheKey = this.getPriceCachingKey(ticker);
    const cachedPrice =
      await this.cacheManager.get<YahooAssetPriceDto>(assetPriceCacheKey);
    if (cachedPrice) {
      this.logger.debug(`Cache hit for asset with ticker: ${ticker}`, {
        ticker,
        price: cachedPrice.price,
      });
      return cachedPrice;
    }

    this.logger.debug(
      `Cache miss for asset with ticker: ${ticker}. Fetching price from provider.`,
      {
        ticker,
      },
    );

    const yahooFinanceData = await this.fetchYahooFinance([ticker]);

    if (!yahooFinanceData || !yahooFinanceData[0].regularMarketPrice) {
      this.logger.error(
        `Error fetching price from provider for asset ${ticker}. Price is missing`,
        {
          ticker,
        },
      );
      throw new BadGatewayException(
        'Error fetching prices from the provider. Price is missing',
      );
    }

    const yahooFinanceAssetPrice: YahooAssetPriceDto = {
      symbol: yahooFinanceData[0].symbol,
      price: yahooFinanceData[0].regularMarketPrice,
    };

    await this.cacheManager.set(
      assetPriceCacheKey,
      yahooFinanceAssetPrice,
      this.PRICE_CACHE_TTL,
    );
    return yahooFinanceAssetPrice;
  }

  async updatePriceByTicker(ticker: string): Promise<YahooAssetPriceDto> {
    const assetPriceCacheKey = this.getPriceCachingKey(ticker);
    await this.cacheManager.del(assetPriceCacheKey);

    const yahooFinanceData = await this.fetchYahooFinance([ticker]);

    if (!yahooFinanceData || !yahooFinanceData[0].regularMarketPrice) {
      throw new BadGatewayException(
        'Error fetching prices from the provider. Price is missing',
      );
    }

    const yahooFinanceAssetPrice: YahooAssetPriceDto = {
      symbol: yahooFinanceData[0].symbol,
      price: yahooFinanceData[0].regularMarketPrice,
    };

    await this.cacheManager.set(
      assetPriceCacheKey,
      yahooFinanceAssetPrice,
      this.PRICE_CACHE_TTL,
    );

    return yahooFinanceAssetPrice;
  }

  async updateAllPrices(assetsList: string[]): Promise<YahooAssetPriceDto[]> {
    let assetsPrices: YahooAssetPriceDto[] = [];
    let assetWithoutPrice: string[] = [];
    let assetUpdated = assetsList.length;

    for (const asset of assetsList) {
      const assetPriceCacheKey = this.getPriceCachingKey(asset);
      const assetPrice =
        await this.cacheManager.get<YahooAssetPriceDto>(assetPriceCacheKey);
      if (!assetPrice) {
        assetWithoutPrice.push(asset);
        continue;
      }
      assetsPrices.push(assetPrice);
    }

    if (assetWithoutPrice.length > 0) {
      const yahooFinanceData = await this.fetchYahooFinance(assetWithoutPrice);

      for (const yahooFinanceAsset of yahooFinanceData) {
        if (!yahooFinanceAsset.regularMarketPrice) {
          assetUpdated--;

          this.logger.warn(
            `Error fetching prices from the provider. Price of ${yahooFinanceAsset.symbol} is missing`,
            {
              symbol: yahooFinanceAsset.symbol,
            },
          );

          continue;
        }
        const yahooFinanceAssetPrice: YahooAssetPriceDto = {
          symbol: yahooFinanceAsset.symbol,
          price: yahooFinanceAsset.regularMarketPrice,
        };

        assetsPrices.push(yahooFinanceAssetPrice);

        const assetPriceCacheKey = this.getPriceCachingKey(
          yahooFinanceAssetPrice.symbol,
        );
        await this.cacheManager.set(
          assetPriceCacheKey,
          yahooFinanceAssetPrice,
          this.PRICE_CACHE_TTL,
        );
      }
    }

    this.logger.info('Asset prices updated successfully', {
      totalAssets: assetsList.length,
      assetsUpdated: assetUpdated,
    });
    return assetsPrices;
  }

  private async fetchYahooFinance(assetList: string[]) {
    const yahooFinanceData: any[] = [];

    try {
      const assetsBatches = this.batchAssetList(assetList);

      for (const assetsBatch of assetsBatches) {
        const data = await this.yf.quote(assetsBatch);
        yahooFinanceData.push(...data);
      }
    } catch (error) {
      this.logger.error('Error fetching prices from the provider', {
        assetList,
        error,
      });
      throw new BadGatewayException('Error fetching prices from the provider');
    }

    if (yahooFinanceData.length === 0) {
      this.logger.error(
        'Error fetching prices from the provider. No data returned',
        {
          assetList,
        },
      );
      throw new BadGatewayException('Error fetching prices from the provider');
    }

    return yahooFinanceData;
  }

  private batchAssetList(assetList: string[]): string[][] {
    let batches: string[][] = [];
    if (assetList.length <= this.BATCH_SIZE) {
      return [assetList];
    }

    const numberOfBatches = Math.ceil(assetList.length / this.BATCH_SIZE);
    for (let i = 0; i < numberOfBatches; i++) {
      const batch = assetList.slice(
        i * this.BATCH_SIZE,
        this.BATCH_SIZE + i * this.BATCH_SIZE,
      );
      batches.push(batch);
    }
    return batches;
  }

  private toInsertAssetDto(yahooFinanceData: ShortAssetYahooFinance[]) {
    const insertAssetsDtos: InsertAssetDto[] = yahooFinanceData.map(
      (yahooFinanceAsset) => ({
        name: yahooFinanceAsset.longName,
        ticker: yahooFinanceAsset.symbol,
        exchange: yahooFinanceAsset.exchange,
      }),
    );

    return insertAssetsDtos;
  }

  getPriceCachingKey(ticker: string): string {
    return `${ticker}-price-key`;
  }
}
