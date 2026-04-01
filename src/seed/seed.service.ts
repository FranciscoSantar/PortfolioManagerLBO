import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { AssetTypesService } from '../asset_types/asset_types.service';
import { AssetsService } from '../assets/assets.service';
import { YahooFinanceService } from '../yahoo-finance/yahoo-finance.service';
import { STOCKS_TICKERS, CRYPTO_SYMBOLS, ASSET_TYPES } from './data/assets-types-and-assets';
import { handlePostgresError } from '../common/utils/postgres-error-handler';

@Injectable()
export class SeedService {

  constructor(
    private readonly assetTypesService: AssetTypesService,
    private readonly assetService: AssetsService,
    private readonly yahooFinanceService: YahooFinanceService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(SeedService.name)
  }
  async populateDB() {
    try {
      this.logger.info('Starting database seeding process')

      await this.assetTypesService.saveForSeeding(ASSET_TYPES)

      // Start seeding stocks
      const stocksAssetsDtos = await this.yahooFinanceService.getDataForSeeding(STOCKS_TICKERS)
      await this.assetService.saveForSeeding(stocksAssetsDtos, 'STOCK')

      // Then, Cryptos
      const cryptosAssetsDtos = await this.yahooFinanceService.getDataForSeeding(CRYPTO_SYMBOLS)
      await this.assetService.saveForSeeding(cryptosAssetsDtos, 'CRYPTO')

      this.logger.info('Database seeding completed successfully')
    } catch (error) {
      this.logger.error('Error during database seeding', {
        error
      })
      handlePostgresError(error)
    }
  }
}
