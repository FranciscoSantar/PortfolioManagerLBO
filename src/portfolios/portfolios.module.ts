import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PortfoliosService } from './portfolios.service';
import { PortfoliosController } from './portfolios.controller';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioAssetsModule } from '../portfolio-assets/portfolio-assets.module';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio]), PortfolioAssetsModule],
  controllers: [PortfoliosController],
  providers: [PortfoliosService],
  exports: [PortfoliosService]
})
export class PortfoliosModule { }
