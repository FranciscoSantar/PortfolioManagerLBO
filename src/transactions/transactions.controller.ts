import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { User } from '../auth/decorators/user.decorator';
import { FilterTransactionsByDto } from './dto/query-params.dto';
import { ResponseAllTransactionsOfPortfolioAssetDto, ResponseTransactionsWithTotalCommissionDto, ShortResponseTransactionDto } from './dto/response-transaction.dto';

@Controller('portfolios/:portfolioId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @ApiOperation({ summary: 'Create a new transaction of an asset for a specific portfolio' })
  @ApiCreatedResponse({ description: 'The transaction has been successfully created.', type: ShortResponseTransactionDto })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'Portfolio or Asset not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post()
  create(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Body() createTransactionDto: CreateTransactionDto,
    @User('id') userId: string,
  ) {
    return this.transactionsService.create(createTransactionDto, portfolioId, userId);
  }

  @ApiOperation({ summary: 'Get all transactions of a specific portfolio and total of commissions spent.' })
  @ApiOkResponse({ description: 'List of transactions retrieved successfully.', type: ResponseTransactionsWithTotalCommissionDto })
  @ApiBadRequestResponse({ description: 'Invalid filter parameters' })
  @ApiNotFoundResponse({ description: 'Portfolio not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAllTransactionsInPortfolio(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query() filterDto: FilterTransactionsByDto,
    @User('id') userId: string,
  ) {
    return this.transactionsService.findAllTransactionsInPortfolio(portfolioId, userId, filterDto);
  }

  @ApiOperation({ summary: 'Get a specific transaction of a portfolio' })
  @ApiOkResponse({ description: 'Transaction retrieved successfully.', type: ShortResponseTransactionDto })
  @ApiNotFoundResponse({ description: 'Portfolio or Transaction not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get(':transactionId')
  findOneTransactionInPortfolio(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @User('id') userId: string,
  ) {
    return this.transactionsService.findOneTransactionInPortfolio(transactionId, portfolioId, userId);
  }

  @ApiOperation({ summary: 'Get all transactions of a specific asset in a portfolio. Also includes asset details.' })
  @ApiOkResponse({ description: 'List of transactions retrieved successfully.', type: ResponseAllTransactionsOfPortfolioAssetDto })
  @ApiNotFoundResponse({ description: 'Portfolio or Asset not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get('assets/:assetId')
  findTransactionsOfPortfolioAsset(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @User('id') userId: string,
  ) {
    return this.transactionsService.findAllTransactionsOfPortfolioAsset(portfolioId, assetId, userId);

  }
}
