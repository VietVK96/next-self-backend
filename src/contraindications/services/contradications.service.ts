import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContraindicationsService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
  ) {}

  async findAll(identity: UserIdentity) {
    const organization: OrganizationEntity =
      await this.organizationRepo.findOne({
        relations: {
          contraindications: true,
        },
        where: {
          id: identity.org,
        },
      });

    return organization?.contraindications.sort(
      (a, b) => a.position - b.position,
    );
  }
}
