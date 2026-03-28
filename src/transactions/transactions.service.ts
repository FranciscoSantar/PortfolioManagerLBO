import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { AssetsService } from '../assets/assets.service';

@Injectable()
export class TransactionsService {

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly portfolioService: PortfoliosService,
    private readonly assetService: AssetsService
  ) { }

  async create(createTransactionDto: CreateTransactionDto, portfolioId: string, userId: string) {
    try {
      const { assetId } = createTransactionDto
      const asset = await this.assetService.findOne(assetId)
      const portfolio = await this.portfolioService.findOne(portfolioId, userId);

      const transaction = this.transactionRepository.create({
        ...createTransactionDto,
        portfolio,
        asset
      });
      await this.transactionRepository.save(transaction);
      return transaction;

    } catch (error) {
      handlePostgresError(error)
    }
  }

  async findAll(portfolioId: string, userId: string) {
    const portfolio = await this.portfolioService.findOne(portfolioId, userId);
    const transactions = await this.transactionRepository.find({
      where: {
        portfolio
      }
    })
    return transactions;
  }

  async findOne(id: string, portfolioId: string, userId: string) {
    try {
      const portfolio = await this.portfolioService.findOne(portfolioId, userId);
      const transaction = await this.transactionRepository.findOne({
        where: {
          id: id,
          portfolio
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
