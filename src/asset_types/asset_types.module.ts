import { Module } from '@nestjs/common';
import { AssetTypesService } from './asset_types.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetType } from './entities/asset_type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetType])],
  controllers: [],
  providers: [AssetTypesService],
  exports: [AssetTypesService],
})
export class AssetTypesModule {}
