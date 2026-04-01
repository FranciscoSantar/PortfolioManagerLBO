import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssetsService } from './assets.service';
import { Asset } from './entities/asset.entity';
import { AssetTypesModule } from '../asset_types/asset_types.module';
import { AssetsController } from './assets.controller';
import { YahooFinanceModule } from '../yahoo-finance/yahoo-finance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset]),
    AssetTypesModule,
    YahooFinanceModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
