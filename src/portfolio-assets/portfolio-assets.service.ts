import { FindOptionsWhere, Repository } from 'typeorm';

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'

import { PortfolioAsset } from './entities/portfolio-asset.entity';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { YahooFinanceService } from '../yahoo-finance/yahoo-finance.service';
import { AssetPrice } from '../yahoo-finance/interfaces/asset-price.interface';
import { AssetDataWithCurrentValue, ResponsePortfolioAssetDto, ShortResponsePortfolioAssetDto } from './dto/response-portfolio-asset.dto';
import { ShortResponseAssetDto } from '../assets/dtos/response-asset.dto';
import { roundToDecimals } from '../common/utils/float-parser';
import { GetPortfolioAssetsQueryParamsDto, OrderPortolioAsstesByEnum } from '../portfolios/dto/query-params-portfolio.dto';

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

  async getInfoOfPortfolioAssets(portfolioId: string, queryDto: GetPortfolioAssetsQueryParamsDto): Promise<ResponsePortfolioAssetDto> {
    let totalInvested = 0
    let totalAssets = 0
    let totalCurrentValue = 0

    const portfolioAssets = await this.getPortfolioAssetsByPortfolioId(portfolioId, queryDto)

    if (portfolioAssets.length === 0) {
      return {
        assets: [],
        totalAssets: 0,
        totalChangePercent: 0,
        totalInvested: 0,
        totalValue: 0
      }
    }

    const portfolioAssetsTickers = portfolioAssets.map((portfolioAsset) => portfolioAsset.asset.ticker)

    //Update prices in cache
    await this.yahooFinanceService.getAllPrices(portfolioAssetsTickers)


    const portfolioAssetDataWithCurrentValue: AssetDataWithCurrentValue[] = await Promise.all(portfolioAssets.map(async (portfolioAsset) => {

      const assetInfo: ShortResponseAssetDto = {
        id: portfolioAsset.asset.id,
        name: portfolioAsset.asset.name,
        ticker: portfolioAsset.asset.ticker,
        type: portfolioAsset.asset.assetType.type
      }

      const assetPriceCacheKey = this.yahooFinanceService.getPriceCachingKey(portfolioAsset.asset.ticker)
      const portfolioAssetCurrentValue = await this.cacheManager.get<AssetPrice>(assetPriceCacheKey)

      const parsedPortfolioAssetCurrentValue = Number(portfolioAssetCurrentValue?.price)
      const parsedPortfolioAssetQuantity = Number(portfolioAsset.quantity)
      const parsedAverageBuyPrice = Number(portfolioAsset.averageBuyPrice)

      const portfolioAssetTotalInvested = parsedAverageBuyPrice * parsedPortfolioAssetQuantity
      const portfolioAssetTotalValue = parsedPortfolioAssetCurrentValue * parsedPortfolioAssetQuantity
      const portfolioAssetChangePercent = ((parsedPortfolioAssetCurrentValue - parsedAverageBuyPrice) / parsedAverageBuyPrice) * 100

      totalInvested += portfolioAssetTotalInvested
      totalCurrentValue += portfolioAssetTotalValue
      totalAssets += 1

      return {
        id: portfolioAsset.id,
        info: assetInfo,
        quantity: roundToDecimals(parsedPortfolioAssetQuantity),
        changePercent: roundToDecimals(portfolioAssetChangePercent),
        unitPrice: roundToDecimals(parsedPortfolioAssetCurrentValue, 4),
        totalValue: roundToDecimals(portfolioAssetTotalValue, 4),
        avgBuyPrice: roundToDecimals(parsedAverageBuyPrice, 4)
      }
    }))

    const totalChangePercent = ((totalCurrentValue - totalInvested) / totalInvested) * 100
    const response = {
      assets: portfolioAssetDataWithCurrentValue,
      totalAssets,
      totalInvested: roundToDecimals(totalInvested),
      totalChangePercent: roundToDecimals(totalChangePercent),
      totalValue: roundToDecimals(totalCurrentValue, 4)
    };

    const orderedResponse = this.orderPortfolioAssets(response, queryDto)
    return orderedResponse
  }

  async getSummaryOfPortfolio(portfolioId: string) {

    try {
      const portfolioAssets = await this.getPortfolioAssetsByPortfolioId(portfolioId)

      if (portfolioAssets.length === 0) {
        return { totalAssets: 0, totalValue: 0 }
      }

      const portfolioAssetsTickers = portfolioAssets.map((portfolioAsset) => portfolioAsset.asset.ticker)

      //Update prices in cache
      await this.yahooFinanceService.getAllPrices(portfolioAssetsTickers)

      const portfolioTotalValueAndTotalAssets = await this.getPortfolioTotalAssetsAndTotalValue(portfolioAssets)
      return portfolioTotalValueAndTotalAssets
    } catch (error) {
      handlePostgresError(error)
    }
  }


  private async getPortfolioTotalAssetsAndTotalValue(portfolioAssets: PortfolioAsset[]): Promise<ShortResponsePortfolioAssetDto> {
    const totalAssets = portfolioAssets.length
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
  }

  private async getPortfolioAssetsByPortfolioId(portfolioId: string, queryDto?: GetPortfolioAssetsQueryParamsDto) {
    const { filterBy } = queryDto ?? {}

    const where: FindOptionsWhere<PortfolioAsset> = {
      portfolio: { id: portfolioId }
    }

    if (filterBy) {
      where.asset = { assetType: { type: filterBy } }
    }

    const portfolioAssets = await this.portfolioAssetRepository.find({
      where,
      relations: {
        asset: {
          assetType: true
        }
      }
    })
    return portfolioAssets
  }

  private orderPortfolioAssets(response: ResponsePortfolioAssetDto, queryDto: GetPortfolioAssetsQueryParamsDto) {
    const { orderBy = OrderPortolioAsstesByEnum.VALUE } = queryDto ?? {}
    const sortMap: Record<OrderPortolioAsstesByEnum, (a: AssetDataWithCurrentValue, b: AssetDataWithCurrentValue) => number> = {
      [OrderPortolioAsstesByEnum.VALUE]: (a, b) => b.unitPrice - a.unitPrice,
      [OrderPortolioAsstesByEnum.PERCENTAGE]: (a, b) => b.changePercent - a.changePercent,
    }
    response.assets.sort(sortMap[orderBy])
    return response
  }
}
