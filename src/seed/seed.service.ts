import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { AssetTypesService } from '../asset_types/asset_types.service';
import { AssetsService } from '../assets/assets.service';
import { YahooFinanceService } from '../yahoo-finance/yahoo-finance.service';
import {
  STOCKS_TICKERS,
  CRYPTO_SYMBOLS,
  ASSET_TYPES,
} from './data/assets-types-and-assets';
import { TransactionsService } from '../transactions/transactions.service';
import { PortfolioAssetsService } from '../portfolio-assets/portfolio-assets.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly assetTypesService: AssetTypesService,
    private readonly assetService: AssetsService,
    private readonly yahooFinanceService: YahooFinanceService,
    private readonly portfolioAssetsService: PortfolioAssetsService,
    private readonly transactionsService: TransactionsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SeedService.name);
  }
  async populateDB() {
    try {
      this.logger.info('Starting database seeding process');

      const hasPortfolioAssets = await this.portfolioAssetsService.hasAny();
      const hasTransactions = await this.transactionsService.hasAny();

      if (hasPortfolioAssets || hasTransactions) {
        this.logger.error(
          'Error running seeder: there are existing portfolio assets or transactions. Clean them first.',
        );
        throw new Error(
          'Error running seeder: there are existing portfolio assets or transactions. Clean them first.',
        );
      }

      await this.assetService.deleteAllForSeeding();
      await this.assetTypesService.deleteAllForSeeding();

      await this.assetTypesService.saveForSeeding(ASSET_TYPES);

      // Start seeding stocks
      const stocksAssetsDtos =
        await this.yahooFinanceService.getDataForSeeding(STOCKS_TICKERS);

      await this.assetService.saveForSeeding(stocksAssetsDtos, 'STOCK');

      // Then, Cryptos
      const cryptosAssetsDtos =
        await this.yahooFinanceService.getDataForSeeding(CRYPTO_SYMBOLS);
      await this.assetService.saveForSeeding(cryptosAssetsDtos, 'CRYPTO');

      this.logger.info('Database seeding completed successfully');
    } catch (error: unknown) {
      this.logger.error('Error during database seeding', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
