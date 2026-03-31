import { Controller, Get, Header, Param, ParseUUIDPipe, StreamableFile } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { User } from 'src/auth/decorators/user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get(':portfolioId')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="PortfolioReport.xlsx"')
  async getReport(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @User('id') userId: string
  ) {
    const buffer = await this.reportsService.generate(portfolioId, userId)
    return new StreamableFile(buffer)
  }

}
