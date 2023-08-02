import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { ResourceEntity } from 'src/entities/resource.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { CreateResourceDto } from '../dto/createResource.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CForbiddenRequestException } from 'src/common/exceptions/forbidden-request.exception';
import { UserResourceEntity } from 'src/entities/user-resource.entity';
import { UpdateResourceDto } from '../dto/updateResource.dto';

@Injectable()
export class ResourceService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ResourceEntity)
    private resourceRepository: Repository<ResourceEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(UserResourceEntity)
    private userResourceRepository: Repository<UserResourceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(organizationId: number): Promise<ResourceEntity[]> {
    try {
      const getResource = await this.resourceRepository.find({
        where: {
          organizationId,
        },
        relations: { subscribers: true },
        order: {
          name: 'ASC',
        },
      });

      const resource = getResource.map(
        ({ id, name, free, color, subscribers: count }) => ({
          id,
          color,
          name,
          count: count?.length,
          free,
        }),
      );

      return resource;
    } catch (error) {
      return error;
    }
  }

  async find(idResource: number, identity: UserIdentity): Promise<any> {
    try {
      const getResource = await this.resourceRepository.findOne({
        where: {
          id: idResource,
          organizationId: identity?.org,
        },
        relations: { subscribers: true, user: true },
      });

      const {
        archivedAt,
        organizationId,
        createdAt,
        updatedAt,
        useDefaultColor,
        free,
        ...rest
      } = getResource;

      const {
        subscribers: listAssistante,
        user: practitioner,
        userId: practitionerId,
        ...updateRest
      } = rest;

      const result = {
        ...updateRest,
        practitionerId: practitionerId,
        practitioner: `${
          practitioner.lastname && practitioner.firstname
            ? practitioner.lastname + ' ' + practitioner.firstname
            : ''
        }`,
        listAssistante: listAssistante.map(({ id, firstname, lastname }) => ({
          id,
          firstname,
          lastname,
        })),
      };

      return result;
    } catch (err) {
      return err;
    }
  }

  async findAllUsersAndPractitioners(organizationId: number): Promise<any> {
    const getUser = await this.organizationRepository.findOne({
      where: {
        id: organizationId,
      },
      relations: {
        users: { medical: true },
      },
    });

    const users = getUser.users?.map(({ id, firstname, lastname, medical }) => {
      let userMedical = null;
      if (medical !== null) {
        userMedical = {
          id: medical.id,
          userId: medical.userId,
        };
      }

      return {
        id,
        fullname: `${lastname} ${firstname}`,
        medical: userMedical,
      };
    });

    const practitioners = users.filter((user) => user.medical !== null);
    return {
      users,
      practitioners,
    };
  }

  async save(payload: CreateResourceDto, identity: UserIdentity) {
    const currentUser = await this.userRepository.findOne({
      where: {
        id: identity.id,
      },
    });

    if (currentUser.admin !== 1) {
      throw new CForbiddenRequestException(
        'Only the administrator can perform this operation.',
      );
    }

    const getOrg = await this.organizationRepository.findOne({
      where: { id: identity?.org },
      relations: { users: true },
    });

    const resource = new ResourceEntity();
    resource.organizationId = identity.org;
    resource.name = payload.name;
    resource.color = payload?.color;
    resource.useDefaultColor = payload?.userDefaultColor;
    if (payload.addressee !== 0) {
      resource.userId = payload.addressee;
    }

    const users = getOrg.users?.map((usr) => usr.id);

    const subscribersList = payload?.listAssistante.map((item) =>
      Number(item.id),
    );
    const userList = await this.userRepository.find({
      where: { id: In(subscribersList) },
    });

    resource.subscribers = userList;

    const res = await this.resourceRepository.save(resource);
    // for (let sub of subscribersList) {
    //   if (users.includes(sub)) {
    //     const userResource = new UserResourceEntity();
    //     userResource.resourceId = res.id;
    //     userResource.usrId = sub;
    //     this.userResourceRepository.save(userResource);
    //   }
    // }
    return res;
  }

  async update(identity: UserIdentity, payload: UpdateResourceDto) {
    const getResource = await this.resourceRepository.findOne({
      where: {
        id: payload.id,
        organizationId: identity?.org,
      },
      relations: { subscribers: true },
    });
    console.log(getResource);
  }
}
