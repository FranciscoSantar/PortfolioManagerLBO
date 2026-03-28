import { Injectable, NotFoundException } from '@nestjs/common';
import { Asset } from './entities/asset.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) { }

  async findOne(id: string) {
    const asset = await this.assetRepository.findOne({
      where: {
        id: id
      }
    })

    if (!asset) {
      throw new NotFoundException(`Asset with id ${id} was not found.`);
    }

    return asset;

  }
}
