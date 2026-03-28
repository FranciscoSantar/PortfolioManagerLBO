import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { Portfolio } from './entities/portfolio.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class PortfoliosService {
  constructor(

    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) { }

  async create(createPortfolioDto: CreatePortfolioDto, userId: string) {
    try {
      const portfolio = this.portfolioRepository.create({
        ...createPortfolioDto,
        user: {
          id: userId
        }
      });
      await this.portfolioRepository.save(portfolio);
      return portfolio;
    } catch (error) {
      handlePostgresError(error)
    }

  }
  async findAll(userId: string) {
    const portfolios = await this.portfolioRepository.find({
      where: {
        user: {
          id: userId
        },
      }
    })
    return portfolios;
  }

  async findOne(id: string, userId: string) {
    try {
      const portfolio = await this.portfolioRepository.findOne({
        where: {
          id: id,
          user: {
            id: userId
          }
        }
      })

      if (!portfolio) {
        throw new NotFoundException(`Portfolio with ID = ${id} was not found`)
      }

      return portfolio;
    } catch (error) {
      handlePostgresError(error)
    }
  }

  async update(id: string, updatePortfolioDto: UpdatePortfolioDto, userId: string) {
    const portfolio = await this.findOne(id, userId)
    try {
      this.portfolioRepository.merge(portfolio, updatePortfolioDto)
      const updatedPortfolio = await this.portfolioRepository.save(portfolio)
      return updatedPortfolio;

    } catch (error) {
      handlePostgresError(error)
    }
  }

  async remove(id: string, userId: string) {
    const portfolio = await this.findOne(id, userId)

    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Transaction, {
        portfolio
      });

      await manager.softDelete(Portfolio, { id });
    });
    return true
  }
}
