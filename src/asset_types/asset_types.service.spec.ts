import { Test, TestingModule } from '@nestjs/testing';
import { AssetTypesService } from './asset_types.service';

describe('AssetTypesService', () => {
  let service: AssetTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetTypesService],
    }).compile();

    service = module.get<AssetTypesService>(AssetTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
