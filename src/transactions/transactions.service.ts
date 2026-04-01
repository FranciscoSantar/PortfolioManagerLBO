import {
  Repository,
  DataSource,
  FindOptionsWhere,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { PinoLogger } from 'nestjs-pino';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import {
  CommissionType,
  CreateTransactionDto,
} from './dto/create-transaction.dto';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { AssetsService } from '../assets/assets.service';
import { PortfolioAsset } from '../portfolio-assets/entities/portfolio-asset.entity';
import { YahooFinanceService } from '../yahoo-finance/yahoo-finance.service';
import { FilterTransactionsByDto } from './dto/query-params.dto';
import {
  ResponseAllTransactionsOfPortfolioAssetDto,
  ResponseTransactionsWithTotalCommissionDto,
  ShortResponseTransactionDto,
} from './dto/response-transaction.dto';
import { AllTransactionsOfPortfolioAsset } from './interfaces/transaction.interface';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    private readonly portfolioService: PortfoliosService,
    private readonly assetService: AssetsService,
    private readonly yahooFinanceService: YahooFinanceService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TransactionsService.name);
  }

  async create(
    createTransactionDto: CreateTransactionDto,
    portfolioId: string,
    userId: string,
  ): Promise<ShortResponseTransactionDto> {
    try {
      const { assetId, ...transactionData } = createTransactionDto;
      const asset = await this.assetService.findOne(assetId);
      const portfolio = await this.portfolioService.findOne(
        portfolioId,
        userId,
      );

      // Transaction to ensure atomicity between Transactions and portfolio Assets operations
      const transaction = await this.dataSource.transaction(async (manager) => {
        let portfolioAssetNewQuantity = 0;

        // Get current price of portfolio Asset
        if (!transactionData.unitPrice) {
          const portfolioAssetCurrentPrice =
            await this.yahooFinanceService.getPriceByTicker(asset.ticker);
          transactionData.unitPrice = Number(portfolioAssetCurrentPrice.price);
        }

        const { quantity, unitPrice, commission, commissionType } =
          transactionData;
        const parsedQuantity = Number(quantity);
        const parsedUnitPrice = Number(unitPrice);
        const parsedCommission = Number(commission);

        const commissionAmount = this.getCommissionAmout(
          parsedQuantity,
          parsedUnitPrice,
          parsedCommission,
          commissionType,
        );

        const portfolioAsset = await manager.findOne(PortfolioAsset, {
          where: {
            portfolio: { id: portfolioId },
            asset: { id: assetId },
          },
          relations: {
            asset: true,
          },
        });

        if (!portfolioAsset) {
          if (transactionData.operation === TransactionType.SELL) {
            this.logger.warn(
              'Attempt to sell an asset that does not exist in the portfolio',
              {
                portfolioId,
                assetId,
              },
            );

            throw new BadRequestException(
              `Can not Sell because the asset ${asset.ticker} does not exist in the Portfolio`,
            );
          }

          this.logger.info(
            'First time buying this asset, creating new portfolio asset',
            {
              portfolioId,
              assetId,
              quantity: transactionData.quantity,
              unitPrice: transactionData.unitPrice,
              commissionAmount,
            },
          );

          // First Buy, create PortfolioAsset
          const portfolioAsset = manager.create(PortfolioAsset, {
            portfolio: { id: portfolioId },
            asset: { id: assetId },
            quantity: String(transactionData.quantity),
            averageBuyPrice: String(
              (parsedQuantity * parsedUnitPrice + commissionAmount) /
                parsedQuantity,
            ),
          });
          await manager.save(portfolioAsset);
        } else {
          // If Asset already exists in the portfolio, update quantity
          const parsedTransactionQuantity = transactionData.quantity;
          const parsedPortfolioAssetUnitPrice = transactionData.unitPrice;
          const parsedPortfolioAssetQuantity = Number(portfolioAsset.quantity);
          const parsedPortfolioAssetAvgBuyPrice = Number(
            portfolioAsset.averageBuyPrice,
          );

          if (
            transactionData.operation === TransactionType.SELL &&
            parsedPortfolioAssetQuantity < parsedTransactionQuantity
          ) {
            this.logger.warn(
              'Attempt to sell more quantity than the one available in the portfolio',
              {
                portfolioId,
                assetId,
                attemptedSellQuantity: parsedTransactionQuantity,
                availableQuantity: parsedPortfolioAssetQuantity,
              },
            );

            throw new BadRequestException(
              `Insufficient balance to complete the sell order. You have ${parsedPortfolioAssetQuantity} of ${portfolioAsset.asset.ticker}`,
            );
          }

          // Update Quantity
          if (transactionData.operation === TransactionType.SELL) {
            portfolioAssetNewQuantity =
              parsedPortfolioAssetQuantity - parsedTransactionQuantity;
          } else {
            //Update Quantity and Average Buy Price
            portfolioAssetNewQuantity =
              parsedPortfolioAssetQuantity + parsedTransactionQuantity;
            const portfolioAssetNewPrice = parsedPortfolioAssetUnitPrice;
            const portfolioAssetNewAvgBuyPrice =
              (parsedPortfolioAssetQuantity * parsedPortfolioAssetAvgBuyPrice +
                parsedTransactionQuantity * portfolioAssetNewPrice +
                commissionAmount) /
              portfolioAssetNewQuantity;

            portfolioAsset.averageBuyPrice = String(
              portfolioAssetNewAvgBuyPrice,
            );
          }

          // Delete if the asset has been completely sold
          if (portfolioAssetNewQuantity === 0) {
            this.logger.info('Asset completely sold, removing from portfolio', {
              portfolioId,
              assetId,
              portfolioAssetId: portfolioAsset.id,
            });

            await manager.remove(portfolioAsset);
          } else {
            portfolioAsset.quantity = String(portfolioAssetNewQuantity);
            await manager.save(PortfolioAsset, portfolioAsset);
          }
        }

        // Always create a transaction
        const transaction = manager.create(Transaction, {
          quantity: String(transactionData.quantity),
          operation: transactionData.operation,
          unitPrice: transactionData.unitPrice
            ? String(transactionData.unitPrice)
            : undefined,
          commission: transactionData.commission
            ? String(transactionData.commission)
            : undefined,
          commissionType: transactionData.commissionType,
          commissionAmount: String(commissionAmount),
          portfolio: { id: portfolio.id },
          asset: { id: asset.id },
        });
        await manager.save(transaction);
        return transaction;
      });

      this.logger.info('Transaction created successfully', {
        transactionId: transaction.id,
        portfolioId,
        assetId,
        quantity: transaction.quantity,
        operation: transaction.operation,
        unitPrice: transaction.unitPrice,
        commission: transaction.commissionAmount,
      });

      return {
        id: transaction.id,
        quantity: Number(transaction.quantity),
        operation: transaction.operation,
        unitPrice: Number(transaction.unitPrice),
        commission: Number(transaction.commissionAmount),
      };
    } catch (error: unknown) {
      this.logger.error('Error creating transaction', {
        portfolioId,
        createTransactionDto,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }

  async findAllTransactionsInPortfolio(
    portfolioId: string,
    userId: string,
    filterDto?: FilterTransactionsByDto,
  ): Promise<ResponseTransactionsWithTotalCommissionDto> {
    try {
      const { fromDate, toDate, transactionType } = filterDto ?? {};
      const portfolio = await this.portfolioService.findOne(
        portfolioId,
        userId,
      );

      const where: FindOptionsWhere<Transaction> = {
        portfolio: { id: portfolio.id },
      };

      if (transactionType) {
        where.operation = transactionType;
      }

      if (fromDate && toDate) {
        where.createdAt = Between(new Date(fromDate), new Date(toDate));
      } else if (fromDate) {
        where.createdAt = MoreThanOrEqual(new Date(fromDate));
      } else if (toDate) {
        where.createdAt = LessThanOrEqual(new Date(toDate));
      }

      const transactions = await this.transactionRepository.find({
        where,
        relations: {
          asset: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      const transactionsResponsesDto = transactions.map((transaction) => ({
        id: transaction.id,
        quantity: Number(transaction.quantity),
        operation: transaction.operation,
        unitPrice: Number(transaction.unitPrice),
        commission: Number(transaction.commissionAmount),
      }));

      const totalComissionsAmount = transactions.reduce(
        (totalComissions, transaction) =>
          totalComissions + Number(transaction.commissionAmount),
        0,
      );

      return {
        transactions: transactionsResponsesDto,
        totalCommission: totalComissionsAmount,
      };
    } catch (error: unknown) {
      this.logger.error('Error fetching transactions of portfolio', {
        portfolioId,
        userId,
        filterDto,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }

  async findOneTransactionInPortfolio(
    id: string,
    portfolioId: string,
    userId: string,
  ): Promise<ShortResponseTransactionDto> {
    try {
      const portfolio = await this.portfolioService.findOne(
        portfolioId,
        userId,
      );
      const transaction = await this.transactionRepository.findOne({
        where: {
          id: id,
          portfolio: {
            id: portfolio.id,
          },
        },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction with id ${id} was not found.`);
      }

      this.logger.info('Transaction fetched successfully', {
        transactionId: transaction.id,
        portfolioId,
      });

      return {
        id: transaction.id,
        quantity: Number(transaction.quantity),
        operation: transaction.operation,
        unitPrice: Number(transaction.unitPrice),
        commission: Number(transaction.commissionAmount),
      };
    } catch (error: unknown) {
      this.logger.error('Error fetching transaction in portfolio', {
        id,
        portfolioId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }

  async findAllTransactionsOfPortfolioAsset(
    portfolioId: string,
    assetId: string,
    userId: string,
  ): Promise<ResponseAllTransactionsOfPortfolioAssetDto> {
    try {
      // Check if the portfolio exist and belong to the user before fetching transactions
      await this.portfolioService.findOne(portfolioId, userId);
      const asset = await this.assetService.findOne(assetId);

      const transactions = await this.transactionRepository.find({
        where: {
          portfolio: {
            id: portfolioId,
          },
          asset: {
            id: assetId,
          },
        },
        relations: {
          asset: {
            assetType: true,
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });

      const transactionsResponsesDto = transactions.map((transaction) => ({
        id: transaction.id,
        quantity: Number(transaction.quantity),
        operation: transaction.operation,
        unitPrice: Number(transaction.unitPrice),
        commission: Number(transaction.commissionAmount),
      }));

      const assetResponseDto = {
        id: asset.id,
        name: asset.name,
        ticker: asset.ticker,
        type: asset.assetType.type,
      };

      return {
        transactions: transactionsResponsesDto,
        asset: assetResponseDto,
      };
    } catch (error: unknown) {
      this.logger.error('Error fetching transactions of portfolio asset', {
        portfolioId,
        assetId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }

  async findAllTransactionsOfPortfolioAssetEnties(
    portfolioId: string,
    assetId: string,
    userId: string,
  ): Promise<AllTransactionsOfPortfolioAsset> {
    try {
      // Check if the portfolio exist and belong to the user before fetching transactions
      await this.portfolioService.findOne(portfolioId, userId);
      const asset = await this.assetService.findOne(assetId);

      const transactions = await this.transactionRepository.find({
        where: {
          portfolio: {
            id: portfolioId,
          },
          asset: {
            id: assetId,
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        transactions,
        asset,
      };
    } catch (error: unknown) {
      this.logger.error(
        'Error fetching transactions of portfolio asset entities',
        {
          portfolioId,
          assetId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      handlePostgresError(error);
    }
  }

  async hasAny(): Promise<boolean> {
    return this.transactionRepository.exists({});
  }

  private getCommissionAmout(
    quantity: number,
    unitPrice: number,
    commission: number,
    commissionType: CommissionType,
  ): number {
    if (commission === 0 || commissionType === CommissionType.NONE) {
      return 0;
    }

    if (commissionType === CommissionType.FIXED) {
      return commission;
    }

    if (commission > 1) {
      throw new BadRequestException(
        'Percentage commission can not be higher than 1',
      );
    }

    return quantity * unitPrice * commission;
  }
}
