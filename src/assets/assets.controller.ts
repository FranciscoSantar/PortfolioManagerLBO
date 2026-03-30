import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {

  constructor(private readonly assetService: AssetsService) { }

  @Get()
  findAll() {
    return this.assetService.findAll();
  }

  @Post(':ticker/update')
  @HttpCode(204)
  updatePrice(
    @Param('ticker') ticker: string
  ) {
    return this.assetService.updatePrice(ticker)
  }
}
