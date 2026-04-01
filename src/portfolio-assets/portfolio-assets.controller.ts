import { Controller, Param, ParseUUIDPipe, Delete } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { User } from '../auth/decorators/user.decorator';
import { PortfolioAssetsService } from './portfolio-assets.service';

@Controller('portfolios/:portfolioId/assets/:assetId')
export class PortfolioAssetController {
  constructor(private readonly portfolioAssetService: PortfolioAssetsService) {}

  @ApiOperation({ summary: 'Remove an asset from a portfolio' })
  @ApiNoContentResponse({
    description: 'Asset removed from portfolio successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Portfolio or Asset not found' })
  @ApiBearerAuth()
  @Delete(':portfolioAssetId')
  remove(
    @Param('portfolioAssetId', ParseUUIDPipe) portfolioAssetId: string,
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @User('id') userId: string,
  ) {
    return this.portfolioAssetService.remove(
      portfolioId,
      assetId,
      portfolioAssetId,
      userId,
    );
  }
}
