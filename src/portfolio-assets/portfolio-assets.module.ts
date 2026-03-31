import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PortfolioAssetsService } from './portfolio-assets.service';
import { PortfolioAsset } from './entities/portfolio-asset.entity';
import { YahooFinanceModule } from '../yahoo-finance/yahoo-finance.module';
import { PortfolioAssetController } from './portfolio-assets.controller';
@Module({
  imports: [TypeOrmModule.forFeature([PortfolioAsset]), YahooFinanceModule],
  controllers: [PortfolioAssetController],
  providers: [PortfolioAssetsService],
  exports: [PortfolioAssetsService]
})
export class PortfolioAssetsModule { }
