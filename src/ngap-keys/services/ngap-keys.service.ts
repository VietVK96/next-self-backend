import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NgapKeysService {
  constructor(
    @InjectRepository(NgapKeyEntity)
    private ngapKeysRepo: Repository<NgapKeyEntity>,
  ) {}

  async findAll(used: string) {
    let usedCondition = 1;
    if (used && used.toLowerCase?.() !== 'true' && used.toLowerCase?.() !== '1')
      usedCondition = 0;

    const ngapKeys: NgapKeyEntity[] = await this.ngapKeysRepo.find({
      where: {
        used: usedCondition,
      },
    });

    return ngapKeys;
  }
}
