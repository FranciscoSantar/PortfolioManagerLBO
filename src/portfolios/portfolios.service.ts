import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { Portfolio } from './entities/portfolio.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { handlePostgresError } from 'src/common/utils/postgres-error-handler';

@Injectable()
export class PortfoliosService {
  constructor(
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
    try {
      const portfolio = await this.findOne(id, userId)
      this.portfolioRepository.softDelete(portfolio)
      return true;

    } catch (error) {
      handlePostgresError(error)
    }
  }

}
