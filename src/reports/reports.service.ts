import * as XLSX from 'xlsx'

import { Injectable } from '@nestjs/common';

import { PortfoliosService } from '../portfolios/portfolios.service';
import { TransactionsService } from '../transactions/transactions.service';
@Injectable()
export class ReportsService {
  constructor(
    private readonly portfolioService: PortfoliosService,
    private readonly transactionService: TransactionsService
  ) { }

  async generate(portfolioId: string, userId: string): Promise<Buffer> {
    const portfolioData = await this.portfolioService.getPortfolioData(portfolioId, userId)

    const workbook = XLSX.utils.book_new()

    const summaryDataForSheet = [{
      'Cantidad de Activos': portfolioData.totalAssets,
      'Valor Total del Portafolio': portfolioData.totalValue,
      'Total Invertido del Portafolio': portfolioData.totalInvested,
      'ROI (%)': portfolioData.totalRoi,
    }]
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryDataForSheet), 'Resumen')


    const assetsDataForSheet = portfolioData.assets.map((asset) => ({
      'Ticker': asset.info.ticker,
      'Nombre': asset.info.name,
      'Tipo': asset.info.type,
      'Cantidad': asset.quantity,
      'Precio Actual': asset.unitPrice,
      'Precio Promedio de compra': asset.avgBuyPrice,
      'Valor Total': asset.totalValue,
      'ROI (%)': asset.roi,
    }))
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(assetsDataForSheet), 'Activos')

    for (const assetData of portfolioData.assets) {
      const assetId = assetData.info.id
      const assetTransactions = await this.transactionService.findAllTransactionsOfPortfolioAssetEnties(portfolioId, assetId, userId)

      const transactionsDataForSheet = assetTransactions.transactions.map((transaction) => ({
        'Fecha': transaction.createdAt,
        'Operación': transaction.operation,
        'Cantidad': transaction.quantity,
        'Precio Unitario': transaction.unitPrice,
        'Comisión': transaction.commissionAmount,
      }))
      const sheetName = `${assetData.info.ticker}`
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionsDataForSheet), sheetName)
    }

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
  }
}
