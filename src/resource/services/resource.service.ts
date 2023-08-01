import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Query } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ResourceEntity } from 'src/entities/resource.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserResourceEntity } from 'src/entities/user-resource.entity';
import { UserEntity } from 'src/entities/user.entity';

@Injectable()
export class ResourceService {
  constructor(
    @InjectRepository(ResourceEntity)
    private resourceRepository: Repository<ResourceEntity>,
    @InjectRepository(UserResourceEntity)
    private userResourceRepository: Repository<UserResourceEntity>,
    private readonly dataSource: DataSource,
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
  ) {}

  async findAll(organizationId: number): Promise<ResourceEntity[]> {
    // const query = this.dataSource.createQueryBuilder()
    // .select('rsc.id')
    // .from(ResourceEntity, 'rsc')
    // .innerJoin(UserResourceEntity, 'ursc')
    // .innerJoin(UserEntity, 'usr')
    // .where('rsc.organization_id = :organizationId', {organizationId})
    // return query
    return await this.organizationRepository.find({
      where: {
        id: organizationId,
      },
      relations: { resources: { subscribers: true } },
      order: {
        name: 'ASC',
      },
    });
  }
}
