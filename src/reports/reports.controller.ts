import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
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
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename="PortfolioReport.xlsx"')
  async getReport(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @User('id') userId: string,
  ) {
    const buffer = await this.reportsService.generate(portfolioId, userId);
    return new StreamableFile(buffer);
  }
}
