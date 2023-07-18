import { Test, TestingModule } from '@nestjs/testing';
import { SecuritiesService } from './securities.service';

describe('SecuritiesService', () => {
  let service: SecuritiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecuritiesService],
    }).compile();

    service = module.get<SecuritiesService>(SecuritiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
