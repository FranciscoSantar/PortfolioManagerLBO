import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Repository } from 'typeorm';

import { PortfolioAsset } from './entities/portfolio-asset.entity';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { YahooFinanceService } from '../yahoo-finance/yahoo-finance.service';
import { AssetPrice } from 'src/yahoo-finance/interfaces/asset-price.interface';

@Injectable()
export class PortfolioAssetsService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(PortfolioAsset)
    private readonly portfolioAssetRepository: Repository<PortfolioAsset>,
    private readonly yahooFinanceService: YahooFinanceService
  ) { }

  async findOne(portfolioId: string, assetId: string) {
    try {
      const portfolioAsset = await this.portfolioAssetRepository.findOne({
        where: {
          portfolio: { id: portfolioId },
          asset: { id: assetId },
        },
        relations: {
          asset: true
        }
      })

      if (!portfolioAsset) {
        throw new NotFoundException(`The asset does not exists in the Portfolio`)
      }

      return portfolioAsset;
    } catch (error) {
      handlePostgresError(error)
    }
  }

  async getSummaryOfPortfolio(portfolioId: string) {
    try {
      const portfolioAssets = await this.portfolioAssetRepository.find({
        where: {
          portfolio: {
            id: portfolioId
          }
        },
        relations: {
          asset: true
        }
      })

      if (portfolioAssets.length === 0) {
        return { totalAssets: 0, totalValue: 0 }
      }

      const totalAssets = portfolioAssets.length

      const portfolioAssetsTickers = portfolioAssets.map((portfolioAsset) => portfolioAsset.asset.ticker)

      //Update prices in cache
      await this.yahooFinanceService.getAllPrices(portfolioAssetsTickers)

      let totalValue = 0;
      for (const portfolioAsset of portfolioAssets) {
        const assetPriceCacheKey = this.yahooFinanceService.getPriceCachingKey(portfolioAsset.asset.ticker)
        const cachedPrice = await this.cacheManager.get<AssetPrice>(assetPriceCacheKey)
        if (cachedPrice?.price) {
          totalValue += Number(portfolioAsset.quantity) * Number(cachedPrice.price)
        }
      }
      return {
        totalAssets,
        totalValue
      }
    } catch (error) {
      handlePostgresError(error)
    }
  }
}
