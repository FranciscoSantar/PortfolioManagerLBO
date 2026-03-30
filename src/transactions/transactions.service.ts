import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { AssetsService } from '../assets/assets.service';
import { PortfolioAsset } from '../portfolio-assets/entities/portfolio-asset.entity';
import { YahooFinanceService } from 'src/yahoo-finance/yahoo-finance.service';

@Injectable()
export class TransactionsService {

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    private readonly portfolioService: PortfoliosService,
    private readonly assetService: AssetsService,
    private readonly yahooFinanceService: YahooFinanceService
  ) { }

  async create(createTransactionDto: CreateTransactionDto, portfolioId: string, userId: string) {
    try {
      const { assetId, ...transactionData } = createTransactionDto
      const asset = await this.assetService.findOne(assetId)
      const portfolio = await this.portfolioService.findOne(portfolioId, userId);

      // Transaction to ensure atomicity between Transactions and portfolio Assets operations
      await this.dataSource.transaction(async (manager) => {

        const portfolioAsset = await manager.findOne(PortfolioAsset, {
          where: {
            portfolio: { id: portfolioId },
            asset: { id: assetId },
          },
          relations: {
            asset: true
          }
        })

        if (!portfolioAsset) {
          if (transactionData.operation === TransactionType.SELL) {
            throw new BadRequestException(`Can not Sell because the asset ${asset.ticker} does not exist in the Portfolio`)

          }
          // First Buy, create PortfolioAsset
          const portfolioAsset = manager.create(PortfolioAsset, {
            portfolio: { id: portfolioId },
            asset: { id: assetId },
            quantity: transactionData.quantity
          })
          await manager.save(portfolioAsset);

        } else {

          // If Asset already exists in the portfolio, update quantity
          const transactionQuantity = Number(transactionData.quantity)
          const actualPortfolioAssetQuantity = Number(portfolioAsset.quantity)

          if (transactionData.operation === TransactionType.SELL && actualPortfolioAssetQuantity < transactionQuantity) {
            throw new BadRequestException(`Insufficient balance to complete the sell order. You have ${portfolioAsset.quantity} of ${portfolioAsset.asset.ticker}`)
          }
          // Update Quantity
          const newQuantity = transactionData.operation === TransactionType.SELL
            ? actualPortfolioAssetQuantity - transactionQuantity
            : actualPortfolioAssetQuantity + transactionQuantity;

          // Delete if the asset has been completely sold
          if (newQuantity === 0) {
            await manager.remove(portfolioAsset)
          } else {
            portfolioAsset.quantity = String(newQuantity)
            await manager.save(PortfolioAsset, portfolioAsset)
          }

        }

        // Always create a transaction
        if (!transactionData.unitPrice) {
          const assetPrice = await this.yahooFinanceService.getPriceByTicker(asset.ticker)
          transactionData.unitPrice = String(assetPrice.price)
        }
        const transaction = manager.create(Transaction, {
          ...transactionData,
          portfolio: { id: portfolio.id },
          asset: { id: asset.id }
        })
        await manager.save(transaction);
      });
    } catch (error) {
      handlePostgresError(error)
    }
  }

  async findAllTransactionsInPortfolio(portfolioId: string, userId: string) {
    const portfolio = await this.portfolioService.findOne(portfolioId, userId);
    const transactions = await this.transactionRepository.find({
      where: {
        portfolio: {
          id: portfolio.id
        },
      },
      relations: {
        asset: true,
      }

    })
    return transactions;
  }

  async findOneTransactionInPortfolio(id: string, portfolioId: string, userId: string) {
    try {
      const portfolio = await this.portfolioService.findOne(portfolioId, userId);
      const transaction = await this.transactionRepository.findOne({
        where: {
          id: id,
          portfolio: {
            id: portfolio.id
          }
        }
      })

      if (!transaction) {
        throw new NotFoundException(`Transaction with id ${id} was not found.`);
      }

      return transaction;
    } catch (error) {
      handlePostgresError(error)
    }
  }
}
