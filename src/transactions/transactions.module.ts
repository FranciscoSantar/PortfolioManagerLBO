import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { AssetsModule } from '../assets/assets.module';
import { YahooFinanceModule } from 'src/yahoo-finance/yahoo-finance.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), PortfoliosModule, AssetsModule, YahooFinanceModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule { }
