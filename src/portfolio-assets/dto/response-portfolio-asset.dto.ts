import { ShortResponseAssetDto } from "src/assets/dtos/response-asset.dto";

export class ShortResponsePortfolioAssetDto {
  totalAssets: number;
  totalValue: number
}

export class AssetDataWithCurrentValue {
  info: ShortResponseAssetDto;
  totalValue: number;
  quantity: number;
  unitPrice: number;
  changePercent: number;
  avgBuyPrice: number;
}

export class ResponsePortfolioAssetDto {
  assets: AssetDataWithCurrentValue[];
  totalAssets: number;
  totalValue: number;
  totalInvested: number;
  totalChangePercent: number;
}