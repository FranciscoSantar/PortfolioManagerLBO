import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';

import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { User } from '../auth/decorators/user.decorator';

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
    @User('id') userId: string,
  ) {
    return this.transactionsService.findAllTransactionsInPortfolio(portfolioId, userId);
  }

  @Get(':id')
  findOneTransactionInPortfolio(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('id') id: string,
    @User('id') userId: string,
  ) {
    return this.transactionsService.findOneTransactionInPortfolio(id, portfolioId, userId);
  }
}
