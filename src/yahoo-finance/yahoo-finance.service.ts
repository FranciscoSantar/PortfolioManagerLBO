import { Injectable } from '@nestjs/common';
import YahooFinance from "yahoo-finance2";
import { ShortAssetYahooFinance } from './interfaces/asset-yahoo-finance.interface';
import { InsertAssetDto } from 'src/assets/dtos/insert-asset.dto';

@Injectable()
export class YahooFinanceService {
  private readonly yf = new YahooFinance();
  private readonly BATCH_SIZE = 20

  async getDataForSeeding(assetList: string[]) {
    let yahooFinanceData: ShortAssetYahooFinance[] = []

    const assetsBatches = this.batchAssetList(assetList);

    for (const assetsBatch of assetsBatches) {
      const data = await this.yf.quote(assetsBatch);
      const formattedData: ShortAssetYahooFinance[] = data.map((assetData) => ({
        symbol: assetData.symbol,
        longName: assetData.longName,
        exchange: assetData.exchange,
        currency: assetData.currency,
        marketState: assetData.marketState
      }))
      yahooFinanceData.push(...formattedData)
    }
    const insertAssetsDtos: InsertAssetDto[] = this.toInsertAssetDto(yahooFinanceData)
    return insertAssetsDtos;
  }

  async getPriceByTicker() {
    //TODO: Add caching
    const ticker = 'USDT-USD';
    const data = await this.yf.quote(ticker);
  }

  async getAllPrices(assetsList: string[]) {
    //TODO: Add caching
    const ticker = 'USDT-USD';
    const data = await this.yf.quote(assetsList);
  }


  private batchAssetList(assetList: string[]): string[][] {
    let batches: string[][] = []
    if (assetList.length <= this.BATCH_SIZE) {
      return [assetList]
    }

    const numberOfBatches = Math.ceil(assetList.length / this.BATCH_SIZE)
    for (let i = 0; i < numberOfBatches; i++) {
      const batch = assetList.slice(i * this.BATCH_SIZE, this.BATCH_SIZE + i * this.BATCH_SIZE)
      batches.push(batch)
    }
    return batches
  }

  private toInsertAssetDto(yahooFinanceData: ShortAssetYahooFinance[]) {
    const insertAssetsDtos: InsertAssetDto[] = yahooFinanceData.map((yahooFinanceAsset) => ({
      name: yahooFinanceAsset.longName,
      ticker: yahooFinanceAsset.symbol,
      exchange: yahooFinanceAsset.exchange
    }))

    return insertAssetsDtos
  }
}
