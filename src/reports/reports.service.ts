import * as XLSX from 'xlsx';
import { PinoLogger } from 'nestjs-pino';

import { Injectable } from '@nestjs/common';

import { PortfoliosService } from '../portfolios/portfolios.service';
import { TransactionsService } from '../transactions/transactions.service';
import { handlePostgresError } from '../common/utils/postgres-error-handler';
import { roundToDecimals } from '../common/utils/float-parser';
@Injectable()
export class ReportsService {
  constructor(
    private readonly portfolioService: PortfoliosService,
    private readonly transactionService: TransactionsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReportsService.name);
  }

  async generate(portfolioId: string, userId: string): Promise<Buffer> {
    try {
      await this.portfolioService.findOne(portfolioId, userId);
      const portfolioData = await this.portfolioService.getPortfolioData(
        portfolioId,
        userId,
      );

      const workbook = XLSX.utils.book_new();

      const summaryDataForSheet = [
        {
          'Cantidad de Activos': portfolioData.totalAssets,
          'Valor Total del Portafolio': portfolioData.totalValue,
          'Total Invertido del Portafolio': portfolioData.totalInvested,
          'ROI (%)': portfolioData.totalRoi,
        },
      ];
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(summaryDataForSheet),
        'Resumen',
      );

      const assetsDataForSheet = portfolioData.assets.map((asset) => ({
        Ticker: asset.info.ticker,
        Nombre: asset.info.name,
        Tipo: asset.info.type,
        Cantidad: asset.quantity,
        'Precio Actual': asset.unitPrice,
        'Precio Promedio de compra': asset.avgBuyPrice,
        'Valor Total': asset.totalValue,
        'ROI (%)': asset.roi,
      }));
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(assetsDataForSheet),
        'Activos',
      );

      const assetTransactionResults = await Promise.all(
        portfolioData.assets.map((assetData) =>
          this.transactionService.findAllTransactionsOfPortfolioAssetEnties(
            portfolioId,
            assetData.info.id,
            userId,
          ),
        ),
      );

      for (let i = 0; i < portfolioData.assets.length; i++) {
        const assetData = portfolioData.assets[i];
        const assetTransactions = assetTransactionResults[i];

        const transactionsDataForSheet = assetTransactions.transactions.map(
          (transaction) => ({
            Fecha: transaction.createdAt,
            Operación: transaction.operation,
            Cantidad: roundToDecimals(Number(transaction.quantity), 4),
            'Precio Unitario': roundToDecimals(
              Number(transaction.unitPrice),
              4,
            ),
            Comisión: roundToDecimals(Number(transaction.commissionAmount), 4),
          }),
        );

        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(transactionsDataForSheet),
          `${assetData.info.ticker}`,
        );
      }

      this.logger.info(
        {
          portfolioId,
          userId,
        },
        'Report generated successfully',
      );

      return Buffer.from(
        XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
      );
    } catch (error: unknown) {
      this.logger.error(
        {
          portfolioId,
          userId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Error generating report',
      );

      handlePostgresError(error);
    }
  }
}
