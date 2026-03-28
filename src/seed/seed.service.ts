import { Injectable } from '@nestjs/common';
import { AssetTypesService } from 'src/asset_types/asset_types.service';
import { AssetsService } from 'src/assets/assets.service';
import { YahooFinanceService } from 'src/yahoo-finance/yahoo-finance.service';
import { STOCKS_TICKERS, CRYPTO_SYMBOLS, ASSET_TYPES } from './data/assets-types-and-assets';

@Injectable()
export class SeedService {

  constructor(
    private readonly assetTypesService: AssetTypesService,
    private readonly assetService: AssetsService,
    private readonly priceService: YahooFinanceService
  ) { }
  async populateDB() {
    await this.assetTypesService.saveForSeeding(ASSET_TYPES)

    // Start seeding stocks
    const stocksAssetsDtos = await this.priceService.getDataForSeeding(STOCKS_TICKERS)
    await this.assetService.saveForSeeding(stocksAssetsDtos, 'STOCK')

    // Then, Cryptos
    const cryptosAssetsDtos = await this.priceService.getDataForSeeding(CRYPTO_SYMBOLS)
    await this.assetService.saveForSeeding(cryptosAssetsDtos, 'CRYPTO')
  }
}
