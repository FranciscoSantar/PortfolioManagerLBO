import express from 'express';

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ReportsService } from './reports.service';
import { User } from '../auth/decorators/user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({
    summary: 'Generate an Excel report for a specific portfolio',
  })
  @ApiOkResponse({
    description:
      'The Excel report has been successfully generated and is being downloaded.',
  })
  @ApiBadRequestResponse({ description: 'Invalid portfolio ID' })
  @ApiNotFoundResponse({ description: 'Portfolio not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Get(':portfolioId')
  async getReport(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @User('id') userId: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const buffer = await this.reportsService.generate(portfolioId, userId);

    // If file generation is successful, set the appropriate headers for file download
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="PortfolioReport.xlsx"',
    });

    return new StreamableFile(buffer);
  }
}
