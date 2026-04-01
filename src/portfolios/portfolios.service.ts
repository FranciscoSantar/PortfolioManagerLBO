import { DataSource, Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { Portfolio } from './entities/portfolio.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { Transaction } from '../transactions/entities/transaction.entity';
import { PortfolioAssetsService } from '../portfolio-assets/portfolio-assets.service';
import {
  ShortResponsePortfolioDto,
  ShortPortfolioDto,
  ResponseCreatePortfolioDto,
} from './dto/response-portfolio.dto';
import {
  GetPortfolioAssetsQueryParamsDto,
  PagintionPortfolioDto,
} from './dto/query-params-portfolio.dto';
import { PortfolioAsset } from '../portfolio-assets/entities/portfolio-asset.entity';
import { ResponsePortfolioAssetDto } from '../portfolio-assets/dto/response-portfolio-asset.dto';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly portfolioAssetService: PortfolioAssetsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PortfoliosService.name);
  }

  async create(
    createPortfolioDto: CreatePortfolioDto,
    userId: string,
  ): Promise<ResponseCreatePortfolioDto> {
    try {
      const portfolio = this.portfolioRepository.create({
        ...createPortfolioDto,
        user: {
          id: userId,
        },
      });

      await this.portfolioRepository.save(portfolio);
      this.logger.info('Portfolio created successfully', {
        portfolioId: portfolio.id,
        name: portfolio.name,
        baseCoin: portfolio.baseCoin,
        userId,
      });

      return {
        id: portfolio.id,
        name: portfolio.name,
        baseCoin: portfolio.baseCoin,
        description: portfolio.description,
      };
    } catch (error: unknown) {
      this.logger.error('Error creating portfolio', {
        name: createPortfolioDto.name,
        baseCoin: createPortfolioDto.baseCoin,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      handlePostgresError(error);
    }
  }

  async findAll(
    userId: string,
    paginationParams: PagintionPortfolioDto,
  ): Promise<ShortResponsePortfolioDto> {
    try {
      const { pageSize = 10, pageNumber = 0 } = paginationParams;
      const [portfolios, totalPortfolios] =
        await this.portfolioRepository.findAndCount({
          where: {
            user: {
              id: userId,
            },
          },
          take: pageSize,
          skip: pageSize * pageNumber,
        });

      const totalPages = Math.ceil(totalPortfolios / pageSize);

      const portfoliosData: ShortPortfolioDto[] = await Promise.all(
        portfolios.map(async (portfolio) => {
          const portfolioSummary =
            await this.portfolioAssetService.getSummaryOfPortfolio(
              portfolio.id,
            );
          return {
            id: portfolio.id,
            name: portfolio.name,
            summary: portfolioSummary,
          };
        }),
      );

      return {
        data: portfoliosData,
        totalPages,
      };
    } catch (error: unknown) {
      this.logger.error('Error fetching portfolios', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      handlePostgresError(error);
    }
  }

  async getPortfolioData(
    id: string,
    userId: string,
    queryDto?: GetPortfolioAssetsQueryParamsDto,
  ): Promise<ResponsePortfolioAssetDto> {
    // Ensure the portfolio exists and belongs to the user before fetching asset data
    await this.findOne(id, userId);

    try {
      const portfolioAssetsData =
        await this.portfolioAssetService.getInfoOfPortfolioAssets(id, queryDto);
      return portfolioAssetsData;
    } catch (error: unknown) {
      this.logger.error('Error fetching portfolio data', {
        portfolioId: id,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }

  async update(
    id: string,
    updatePortfolioDto: UpdatePortfolioDto,
    userId: string,
  ): Promise<ResponseCreatePortfolioDto> {
    const portfolio = await this.findOne(id, userId);
    try {
      this.portfolioRepository.merge(portfolio, updatePortfolioDto);
      const updatedPortfolio = await this.portfolioRepository.save(portfolio);

      this.logger.info('Portfolio updated successfully', {
        portfolioId: updatedPortfolio.id,
        name: updatedPortfolio.name,
        baseCoin: updatedPortfolio.baseCoin,
        userId,
      });

      return {
        id: updatedPortfolio.id,
        name: updatedPortfolio.name,
        baseCoin: updatedPortfolio.baseCoin,
        description: updatedPortfolio.description,
      };
    } catch (error: unknown) {
      this.logger.error('Error updating portfolio', {
        portfolioId: id,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }

  async remove(id: string, userId: string): Promise<boolean> {
    try {
      const portfolio = await this.findOne(id, userId);

      await this.dataSource.transaction(async (manager) => {
        await manager.softDelete(Transaction, {
          portfolio,
        });

        await manager.softDelete(PortfolioAsset, {
          portfolio,
        });

        await manager.softDelete(Portfolio, { id });
      });

      this.logger.info('Portfolio deleted successfully', {
        portfolioId: id,
        userId,
      });

      return true;
    } catch (error: unknown) {
      this.logger.error('Error deleting portfolio', {
        portfolioId: id,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      handlePostgresError(error);
    }
  }

  async findOne(id: string, userId: string): Promise<Portfolio> {
    try {
      const portfolio = await this.portfolioRepository.findOne({
        where: {
          id: id,
          user: {
            id: userId,
          },
        },
        relations: {
          assets: true,
        },
      });

      if (!portfolio) {
        this.logger.warn('Portfolio not found', {
          portfolioId: id,
          userId,
        });
        throw new NotFoundException(`Portfolio with ID = ${id} was not found`);
      }
      return portfolio;
    } catch (error: unknown) {
      this.logger.error('Error fetching portfolio', {
        portfolioId: id,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      handlePostgresError(error);
    }
  }
}
