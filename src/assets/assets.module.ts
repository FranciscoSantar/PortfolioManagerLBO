import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssetsService } from './assets.service';
import { Asset } from './entities/asset.entity';
import { AssetTypesModule } from 'src/asset_types/asset_types.module';

@Module({
  imports: [TypeOrmModule.forFeature([Asset]), AssetTypesModule],
  controllers: [],
  providers: [AssetsService],
  exports: [AssetsService]
})
export class AssetsModule { }
