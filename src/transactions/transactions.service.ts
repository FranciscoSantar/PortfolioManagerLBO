import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CommissionType, Transaction, TransactionType } from './entities/transaction.entity';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { AssetsService } from '../assets/assets.service';
import { PortfolioAsset } from '../portfolio-assets/entities/portfolio-asset.entity';
import { YahooFinanceService } from '../yahoo-finance/yahoo-finance.service';

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
        let portfolioAssetNewQuantity = 0

        // Get current price of portfolio Asset
        if (!transactionData.unitPrice) {
          const portfolioAssetCurrentPrice = await this.yahooFinanceService.getPriceByTicker(asset.ticker)
          transactionData.unitPrice = String(portfolioAssetCurrentPrice.price)
        }

        const { quantity, unitPrice, commission, commissionType } = transactionData
        const parsedQuantity = Number(quantity)
        const parsedUnitPrice = Number(unitPrice)
        const parsedCommission = Number(commission)

        const commissionAmount = this.getCommissionAmout(parsedQuantity, parsedUnitPrice, parsedCommission, commissionType)

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
            quantity: transactionData.quantity,
            averageBuyPrice: String((parsedQuantity * parsedUnitPrice + commissionAmount) / parsedQuantity),
          })
          await manager.save(portfolioAsset);

        } else {

          // If Asset already exists in the portfolio, update quantity
          const parsedTransactionQuantity = Number(transactionData.quantity)
          const parsedPortfolioAssetQuantity = Number(portfolioAsset.quantity)
          const parsedPortfolioAssetAvgBuyPrice = Number(portfolioAsset.averageBuyPrice)

          if (transactionData.operation === TransactionType.SELL && parsedPortfolioAssetQuantity < parsedTransactionQuantity) {
            throw new BadRequestException(`Insufficient balance to complete the sell order. You have ${portfolioAsset.quantity} of ${portfolioAsset.asset.ticker}`)
          }

          // Update Quantity
          if (transactionData.operation === TransactionType.SELL) {

            portfolioAssetNewQuantity = parsedPortfolioAssetQuantity - parsedTransactionQuantity

          } else {
            //Update Quantity and Average Buy Price
            portfolioAssetNewQuantity = parsedPortfolioAssetQuantity + parsedTransactionQuantity
            const portfolioAssetNewPrice = Number(transactionData.unitPrice)
            const portfolioAssetNewAvgBuyPrice =
              (parsedPortfolioAssetQuantity * parsedPortfolioAssetAvgBuyPrice + (parsedTransactionQuantity * portfolioAssetNewPrice) + commissionAmount) / portfolioAssetNewQuantity

            portfolioAsset.averageBuyPrice = String(portfolioAssetNewAvgBuyPrice)
          }

          // Delete if the asset has been completely sold
          if (portfolioAssetNewQuantity === 0) {
            await manager.remove(portfolioAsset)
          } else {
            portfolioAsset.quantity = String(portfolioAssetNewQuantity)
            await manager.save(PortfolioAsset, portfolioAsset)
          }

        }

        // Always create a transaction

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

  async findAllTransactionsOfPortfolioAsset(portfolioId: string, assetId: string, userId: string) {
    try {
      const portfolio = await this.portfolioService.findOne(portfolioId, userId);
      const asset = await this.assetService.findOne(assetId);

      const transactions = await this.transactionRepository.find({
        where: {
          portfolio: {
            id: portfolioId,
          },
          asset: {
            id: assetId
          }
        }
      })

      return {
        transactions,
        asset
      };
    } catch (error) {
      handlePostgresError(error)
    }
  }

  private getCommissionAmout(quantity: number, unitPrice: number, commission: number, commissionType: CommissionType): number {
    if (commission === 0 || commissionType === CommissionType.NONE) {
      return 0
    }

    if (commissionType === CommissionType.FIXED) {
      return commission
    }

    if (commission > 1) {
      throw new BadRequestException('Percentage commission can not be higher than 1')
    }

    return quantity * unitPrice * commission
  }
}
