import { Quote } from 'yahoo-finance2/modules/quote';
import YahooFinance from 'yahoo-finance2';
import { PinoLogger } from 'nestjs-pino';

import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

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
    const data = await this.fetchYahooFinance(assetList);
    const yahooFinanceShortData: InsertAssetDto[] = data.map(
      (assetData: Quote) => ({
        name: assetData.longName as string,
        ticker: assetData.symbol as string,
        exchange: assetData.exchange as string,
      }),
    );

    return yahooFinanceShortData;
  }

  async getPriceByTicker(ticker: string): Promise<YahooAssetPriceDto> {
    const assetPriceCacheKey = this.getPriceCachingKey(ticker);
    const cachedPrice =
      await this.cacheManager.get<YahooAssetPriceDto>(assetPriceCacheKey);
    if (cachedPrice) {
      this.logger.debug(
        {
          ticker,
          price: cachedPrice.price,
        },
        `Cache hit for asset with ticker: ${ticker}`,
      );
      return cachedPrice;
    }

    this.logger.debug(
      {
        ticker,
      },
      `Cache miss for asset with ticker: ${ticker}. Fetching price from provider.`,
    );

    const yahooFinanceData = await this.fetchYahooFinance([ticker]);

    if (!yahooFinanceData || !yahooFinanceData[0].regularMarketPrice) {
      this.logger.error(
        {
          ticker,
        },
        `Error fetching price from provider for asset ${ticker}. Price is missing`,
      );
      throw new BadGatewayException(
        'Error fetching prices from the provider. Price is missing',
      );
    }

    const yahooFinanceAssetPrice: YahooAssetPriceDto = {
      symbol: yahooFinanceData[0].symbol as string,
      price: yahooFinanceData[0].regularMarketPrice as string,
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
      symbol: yahooFinanceData[0].symbol as string,
      price: yahooFinanceData[0].regularMarketPrice as string,
    };

    await this.cacheManager.set(
      assetPriceCacheKey,
      yahooFinanceAssetPrice,
      this.PRICE_CACHE_TTL,
    );

    return yahooFinanceAssetPrice;
  }

  async updateAllPrices(assetsList: string[]): Promise<YahooAssetPriceDto[]> {
    const assetsPrices: YahooAssetPriceDto[] = [];
    const assetWithoutPrice: string[] = [];
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
            {
              symbol: yahooFinanceAsset.symbol as string,
            },
            `Error fetching prices from the provider. Price of ${yahooFinanceAsset.symbol} is missing`,
          );

          continue;
        }
        const yahooFinanceAssetPrice: YahooAssetPriceDto = {
          symbol: yahooFinanceAsset.symbol as string,
          price: yahooFinanceAsset.regularMarketPrice as string,
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

    this.logger.info(
      {
        totalAssets: assetsList.length,
        assetsUpdated: assetUpdated,
      },
      'Asset prices updated successfully',
    );
    return assetsPrices;
  }

  private async fetchYahooFinance(assetList: string[]): Promise<Quote[]> {
    const yahooFinanceData: Quote[] = [];

    try {
      const assetsBatches = this.batchAssetList(assetList);

      for (const assetsBatch of assetsBatches) {
        const data = await this.yf.quote(assetsBatch);
        yahooFinanceData.push(...data);
      }
    } catch (error: unknown) {
      this.logger.error(
        {
          assetList,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error fetching prices from the provider',
      );
      throw new BadGatewayException('Error fetching prices from the provider');
    }

    if (yahooFinanceData.length === 0) {
      this.logger.error(
        {
          assetList,
        },
        'Error fetching prices from the provider. No data returned',
      );
      throw new BadGatewayException('Error fetching prices from the provider');
    }

    return yahooFinanceData;
  }

  private batchAssetList(assetList: string[]): string[][] {
    const batches: string[][] = [];
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

  getPriceCachingKey(ticker: string): string {
    return `${ticker}-price-key`;
  }
}
