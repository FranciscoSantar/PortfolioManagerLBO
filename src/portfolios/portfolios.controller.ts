import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';

import { User } from '../auth/decorators/user.decorator';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { GetPortfolioAssetsQueryParamsDto, PagintionPortfolioDto } from './dto/query-params-portfolio.dto';

@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) { }

  @Post()
  create(
    @Body() createPortfolioDto: CreatePortfolioDto,
    @User('id') userId: string
  ) {
    return this.portfoliosService.create(createPortfolioDto, userId);
  }

  @Get()
  findAll(
    @User('id') userId: string,
    @Query() paginationDto: PagintionPortfolioDto
  ) {
    return this.portfoliosService.findAll(userId, paginationDto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: GetPortfolioAssetsQueryParamsDto,
    @User('id') userId: string
  ) {
    return this.portfoliosService.getPortfolioData(id, userId, queryDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @User('id') userId: string
  ) {
    return this.portfoliosService.update(id, updatePortfolioDto, userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @User('id') userId: string
  ) {
    return this.portfoliosService.remove(id, userId);
  }
}
