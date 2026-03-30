import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { Portfolio } from './entities/portfolio.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { Transaction } from '../transactions/entities/transaction.entity';
import { PortfolioAssetsService } from '../portfolio-assets/portfolio-assets.service';
import { ShortResponseDto, ShortResponsePortfolioDto } from './dto/response-portfolio.dto';
import { PagintionPortfolioDto } from './dto/pagination-portfolio.dto';

@Injectable()
export class PortfoliosService {
  constructor(

    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,

    private readonly portfolioAssetService: PortfolioAssetsService
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
  async findAll(userId: string, paginationParams: PagintionPortfolioDto): Promise<ShortResponseDto> {
    const { pageSize = 10, pageNumber = 0 } = paginationParams
    const [portfolios, totalPortfolios] = await this.portfolioRepository.findAndCount({
      where: {
        user: {
          id: userId
        }
      },
      take: pageSize,
      skip: pageSize * pageNumber
    })

    const totalPages = Math.ceil(totalPortfolios / pageSize)

    const portfoliosData: ShortResponsePortfolioDto[] = await Promise.all(
      portfolios.map(async (portfolio) => {
        const portfolioSummary = await this.portfolioAssetService.getSummaryOfPortfolio(portfolio.id)
        return {
          id: portfolio.id,
          name: portfolio.name,
          summary: portfolioSummary,
        }
      })
    )

    return {
      data: portfoliosData,
      totalPages
    };
  }

  async getPortfolioData(id: string, userId: string) {
    const portfolio = await this.findOne(id, userId)
    try {
      const portfolioAssetsData = await this.portfolioAssetService.getInfoOfPortfolioAssets(id)
      return portfolioAssetsData
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

  async findOne(id: string, userId: string) {
    try {
      const portfolio = await this.portfolioRepository.findOne({
        where: {
          id: id,
          user: {
            id: userId
          }
        },
        relations: {
          assets: true
        }
      })

      if (!portfolio) {
        throw new NotFoundException(`Portfolio with ID = ${id} was not found`)
      }

      const portfolioAssetsData = this.portfolioAssetService.getInfoOfPortfolioAssets(id)
      return portfolio;
    } catch (error) {
      handlePostgresError(error)
    }
  }
}
