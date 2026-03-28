import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssetsService } from './assets.service';
import { Asset } from './entities/asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asset])],
  controllers: [],
  providers: [AssetsService],
  exports: [AssetsService]
})
export class AssetsModule { }
