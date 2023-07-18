import { Test, TestingModule } from '@nestjs/testing';
import { SecuritiesController } from './securities.controller';
import { SecuritiesService } from './securities.service';

describe('SecuritiesController', () => {
  let controller: SecuritiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecuritiesController],
      providers: [SecuritiesService],
    }).compile();

    controller = module.get<SecuritiesController>(SecuritiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
