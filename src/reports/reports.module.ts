import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  imports: [TransactionsModule, PortfoliosModule],
})
export class ReportsModule {}
