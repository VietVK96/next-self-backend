import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { identity } from 'rxjs';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { FindAllStructDto } from 'src/contact/dto/findAll.contact.dto';
import { FindContactService } from 'src/contact/services/find.contact.service';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { Condition, FindOneOptions, Repository } from 'typeorm';

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
