import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('portfolios/:portfolioId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post('')
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Query('userId', ParseUUIDPipe) userId: string,
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string
  ) {
    return this.transactionsService.create(createTransactionDto, portfolioId, userId);
  }

  @Get()
  findAll(
    @Query('userId', ParseUUIDPipe) userId: string,
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string
  ) {
    return this.transactionsService.findAll(portfolioId, userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('userId', ParseUUIDPipe) userId: string,
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string
  ) {
    return this.transactionsService.findOne(id, portfolioId, userId);
  }
}
