import { Module } from '@nestjs/common';
import { YahooFinanceService } from './yahoo-finance.service';

@Module({
  providers: [YahooFinanceService],
  controllers: [],
  exports: [YahooFinanceService],
})
export class YahooFinanceModule {}
