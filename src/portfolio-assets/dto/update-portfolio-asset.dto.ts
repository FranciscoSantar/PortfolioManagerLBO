import { PartialType } from '@nestjs/mapped-types';
import { CreatePortfolioAssetDto } from './create-portfolio-asset.dto';

export class UpdatePortfolioAssetDto extends PartialType(CreatePortfolioAssetDto) {}
