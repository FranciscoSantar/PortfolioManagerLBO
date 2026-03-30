import { IsNumberString, Matches, IsUUID } from "class-validator";
import { Transform } from "class-transformer";

export class CreatePortfolioAssetDto {
  @IsNumberString()
  @Transform(({ value }) => value.trim())
  @Matches(/^[^-].*/, { message: 'quantity should be a positive number' })
  quantity: string;

  @IsUUID()
  assetId: string

  @IsUUID()
  portfolioId: string;
}
