import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { AssetTypesModule } from 'src/asset_types/asset_types.module';
import { AssetsModule } from 'src/assets/assets.module';
import { YahooFinanceModule } from 'src/yahoo-finance/yahoo-finance.module';

@Module({
  imports: [AssetTypesModule, AssetsModule, YahooFinanceModule],
  providers: [SeedService]
})
export class SeedModule { }
