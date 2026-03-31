import { Controller, Param, ParseUUIDPipe, Delete } from '@nestjs/common';

import { User } from '../auth/decorators/user.decorator';
import { PortfolioAssetsService } from './portfolio-assets.service';

@Controller('portfolios/:portfolioId/assets/:assetId')
export class PortfolioAssetController {
  constructor(private readonly portfolioAssetService: PortfolioAssetsService) { }

  @Delete(':portfolioAssetId')
  remove(
    @Param('portfolioAssetId', ParseUUIDPipe) portfolioAssetId: string,
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @User('id') userId: string,
  ) {
    return this.portfolioAssetService.remove(portfolioId, assetId, portfolioAssetId, userId)
  }
}