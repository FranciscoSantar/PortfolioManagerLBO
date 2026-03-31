import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { User } from '../auth/decorators/user.decorator';
import { FilterTransactionsByDto } from './dto/query-params.dto';

@Controller('portfolios/:portfolioId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post()
  create(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Body() createTransactionDto: CreateTransactionDto,
    @User('id') userId: string,
  ) {
    return this.transactionsService.create(createTransactionDto, portfolioId, userId);
  }

  @Get()
  findAllTransactionsInPortfolio(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query() filterDto: FilterTransactionsByDto,
    @User('id') userId: string,
  ) {
    return this.transactionsService.findAllTransactionsInPortfolio(portfolioId, userId, filterDto);
  }

  @Get(':id')
  findOneTransactionInPortfolio(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('id') id: string,
    @User('id') userId: string,
  ) {
    return this.transactionsService.findOneTransactionInPortfolio(id, portfolioId, userId);
  }

  @Get('assets/:assetId')
  findTransactionsOfPortfolioAsset(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @User('id') userId: string,
  ) {
    return this.transactionsService.findAllTransactionsOfPortfolioAsset(portfolioId, assetId, userId);

  }
}
