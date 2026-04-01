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
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { User } from '../auth/decorators/user.decorator';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import {
  GetPortfolioAssetsQueryParamsDto,
  PagintionPortfolioDto,
} from './dto/query-params-portfolio.dto';
import {
  ResponseCreatePortfolioDto,
  ShortResponsePortfolioDto,
} from './dto/response-portfolio.dto';
import { ResponsePortfolioAssetDto } from 'src/portfolio-assets/dto/response-portfolio-asset.dto';

@Controller('portfolios')
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @ApiOperation({ summary: 'Create a new portfolio' })
  @ApiCreatedResponse({
    description: 'The portfolio has been successfully created.',
    type: ResponseCreatePortfolioDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post()
  create(
    @Body() createPortfolioDto: CreatePortfolioDto,
    @User('id') userId: string,
  ) {
    return this.portfoliosService.create(createPortfolioDto, userId);
  }

  @ApiOperation({ summary: 'Get all portfolios of the user with pagination' })
  @ApiOkResponse({
    description: 'List of portfolios retrieved successfully.',
    type: ShortResponsePortfolioDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid pagination parameters' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAll(
    @User('id') userId: string,
    @Query() paginationDto: PagintionPortfolioDto,
  ) {
    return this.portfoliosService.findAll(userId, paginationDto);
  }

  @ApiOperation({ summary: 'Get a portfolio by ID' })
  @ApiOkResponse({
    description: 'Portfolio retrieved successfully.',
    type: ResponsePortfolioAssetDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid portfolio ID' })
  @ApiNotFoundResponse({ description: 'Portfolio not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: GetPortfolioAssetsQueryParamsDto,
    @User('id') userId: string,
  ) {
    return this.portfoliosService.getPortfolioData(id, userId, queryDto);
  }

  @ApiOperation({ summary: 'Update a portfolio by ID' })
  @ApiOkResponse({
    description: 'Portfolio updated successfully.',
    type: ResponseCreatePortfolioDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or portfolio ID' })
  @ApiNotFoundResponse({ description: 'Portfolio not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @User('id') userId: string,
  ) {
    return this.portfoliosService.update(id, updatePortfolioDto, userId);
  }

  @ApiOperation({ summary: 'Delete a portfolio by ID' })
  @ApiNoContentResponse({ description: 'Portfolio deleted successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid portfolio ID' })
  @ApiNotFoundResponse({ description: 'Portfolio not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @User('id') userId: string) {
    return this.portfoliosService.remove(id, userId);
  }
}
