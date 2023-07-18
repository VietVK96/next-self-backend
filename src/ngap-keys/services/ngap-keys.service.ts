import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class NgapKeysService {
  constructor(
    @InjectRepository(NgapKeyEntity)
    private ngapKeysRepo: Repository<NgapKeyEntity>,
  ) {}

  async findAll(used: string, identity: UserIdentity) {
    let usedCondition = 1;
    if (used && used.toLowerCase?.() !== 'true' && used.toLowerCase?.() !== '1')
      usedCondition = 0;

    const ngapKeys: NgapKeyEntity[] = await this.ngapKeysRepo.find({
      where: {
        used: usedCondition,
        organizationId: identity.org,
      },
      order: {
        name: 'ASC',
      },
    });

    return ngapKeys;
  }

  async findByCondition(
    condition: FindOneOptions<NgapKeyEntity>,
    identity: UserIdentity,
  ) {
    return await this.ngapKeysRepo.findOneBy({
      ...condition,
      organizationId: identity.org,
    });
  }
}
