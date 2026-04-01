import { Module } from '@nestjs/common';

import { SeedService } from './seed.service';
import { AssetTypesModule } from '../asset_types/asset_types.module';
import { AssetsModule } from '../assets/assets.module';
import { YahooFinanceModule } from '../yahoo-finance/yahoo-finance.module';
import { PortfolioAssetsModule } from '../portfolio-assets/portfolio-assets.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    AssetTypesModule,
    AssetsModule,
    YahooFinanceModule,
    TransactionsModule,
    PortfolioAssetsModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
