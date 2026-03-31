import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { AssetsService } from './assets.service';
import { ShortResponseAssetDto } from './dtos/response-asset.dto';
import { YahooAssetPriceDto } from '../yahoo-finance/dto/yahoo-asset-price.dto';

@Controller('assets')
export class AssetsController {

  constructor(private readonly assetService: AssetsService) { }

  @ApiOperation({ summary: 'Get all assets' })
  @ApiOkResponse({ description: 'List of all assets', type: [ShortResponseAssetDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get()
  findAll() {
    return this.assetService.findAll();
  }

  @ApiOperation({ summary: 'Update the price of an asset' })
  @ApiOkResponse({ description: 'Asset price updated successfully', type: YahooAssetPriceDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Asset not found' })
  @Post(':ticker/update')
  updatePrice(
    @Param('ticker') ticker: string
  ) {
    return this.assetService.updatePrice(ticker)
  }
}
