import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PortfolioAssetsService } from './portfolio-assets.service';
import { PortfolioAsset } from './entities/portfolio-asset.entity';
import { YahooFinanceModule } from 'src/yahoo-finance/yahoo-finance.module';

@Module({
  imports: [TypeOrmModule.forFeature([PortfolioAsset]), YahooFinanceModule],
  controllers: [],
  providers: [PortfolioAssetsService],
  exports: [PortfolioAssetsService]
})
export class PortfolioAssetsModule { }
