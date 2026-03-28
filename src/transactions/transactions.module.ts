import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { PortfoliosModule } from 'src/portfolios/portfolios.module';
import { AssetsModule } from 'src/assets/assets.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), PortfoliosModule, AssetsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule { }
