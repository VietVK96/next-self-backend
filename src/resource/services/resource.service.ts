import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { ResourceEntity } from 'src/entities/resource.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { CreateResourceDto } from '../dto/createResource.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UserResourceEntity } from 'src/entities/user-resource.entity';
import { UpdateResourceDto } from '../dto/updateResource.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { SuccessResponse } from 'src/common/response/success.res';
import { FindAllUsersAndPractitionersDto } from '../dto/findAllUsersAndPractitioners.dto';
import { MailTransportService } from 'src/mail/services/mailTransport.service';

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
    private readonly mailerService: MailTransportService,
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

  async find(
    idResource: number,
    identity: UserIdentity,
  ): Promise<ResourceEntity> {
    try {
      const getResource = await this.resourceRepository.findOne({
        where: {
          id: idResource,
          organizationId: identity?.org,
        },
        relations: { subscribers: true, user: true },
      });

      const {
        // archivedAt,
        // organizationId,
        // createdAt,
        // updatedAt,
        // useDefaultColor,
        // free,
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
          practitioner?.lastname && practitioner?.firstname
            ? practitioner?.lastname + ' ' + practitioner?.firstname
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

  async findAllUsersAndPractitioners(
    identity: UserIdentity,
  ): Promise<FindAllUsersAndPractitionersDto> {
    const getUser = await this.organizationRepository.findOne({
      where: {
        id: identity?.org,
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

    const result: FindAllUsersAndPractitionersDto = {
      practitioners,
      users,
    };
    return result;
  }

  async save(
    payload: CreateResourceDto,
    identity: UserIdentity,
  ): Promise<SuccessResponse> {
    const currentUser = await this.userRepository.findOne({
      where: {
        id: identity?.id,
      },
    });
    if (!currentUser) throw new CBadRequestException(ErrorCode.NOT_FOUND);

    if (!currentUser?.admin) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }

    const getOrg = await this.organizationRepository.findOne({
      where: { id: identity?.org },
    });
    if (!getOrg) throw new CBadRequestException(ErrorCode.FORBIDDEN);

    const resource = new ResourceEntity();
    resource.organizationId = getOrg?.id;
    resource.name = payload?.name;
    if (payload?.useDefaultColor === 1) {
      resource.useDefaultColor = 1;
      resource.color = JSON.parse(
        `{"background": "#000000", "foreground": "#ffffff"}`,
      );
    } else {
      resource.useDefaultColor = 0;
      resource.color = payload?.color;
    }
    resource.free = 0;
    const addresseeId = payload?.addressee;
    if (addresseeId !== 0) {
      const doctor = await this.userRepository.findOneOrFail({
        where: { id: addresseeId },
      });
      if (doctor) resource.userId = doctor?.id;
    }
    const res = await this.resourceRepository.save(resource);

    const subscribersIdList = payload?.listAssistante.map((item) =>
      Number(item.id),
    );
    const userList = await this.userRepository.find({
      where: { id: In(subscribersIdList) },
    });

    for (const u of userList) {
      await this.userResourceRepository.save({
        usrId: u?.id,
        resourceId: res.id,
      });
    }

    /**
     * Envoi d'un email au service commercial pour indiquer qu'un agenda supplémentaire a été créé.
     * /settings/resource/store.php 63->71
     */
    const creator = `${currentUser.lastname} ${currentUser.firstname}`;
    try {
      await this.mailerService.sendEmail(identity.id, {
        from: 'noreply@weclever.com',
        to: 'admin@dentalviamedilor.com',
        subject: 'Agenda supplémentaire',
        html: `Un agenda supplémentaire ${res.name} a été créé par ${creator}.`,
      });
    } catch (error) {}

    return {
      success: true,
    };
  }

  async update(
    identity: UserIdentity,
    payload: UpdateResourceDto,
  ): Promise<SuccessResponse> {
    const currentUser = await this.userRepository.findOne({
      where: {
        id: identity?.id,
      },
    });
    if (!currentUser) throw new CBadRequestException(ErrorCode.NOT_FOUND);

    if (!currentUser?.admin) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }

    const currentResource = await this.resourceRepository.findOne({
      where: {
        id: payload?.id,
        organizationId: identity?.org,
      },
      relations: { subscribers: true },
    });

    if (!currentResource) throw new CBadRequestException(ErrorCode.NOT_FOUND);

    const actualSubcsribers: UserEntity[] = await this.dataSource
      .getRepository(UserResourceEntity)
      .createQueryBuilder()
      .relation(ResourceEntity, 'subscribers')
      .of(currentResource)
      .loadMany();

    currentResource.name = payload?.name;
    if (payload?.useDefaultColor === 1) {
      currentResource.useDefaultColor = 1;
      currentResource.color = JSON.parse(
        `{"background": "#000000", "foreground": "#ffffff"}`,
      );
    } else {
      currentResource.useDefaultColor = 0;
      currentResource.color = payload?.color;
    }

    const listAssistante = payload?.listAssistante?.map((item) =>
      Number(item?.id),
    );
    const users = await this.userRepository.find({
      where: { id: In(listAssistante) },
    });

    await this.resourceRepository.save(currentResource);

    for (const sub of actualSubcsribers) {
      if (!users.includes(sub)) {
        await this.userResourceRepository.delete({
          usrId: sub.id,
          resourceId: currentResource.id,
        });
      }
    }

    for (const u of users) {
      await this.userResourceRepository.save({
        usrId: u?.id,
        resourceId: currentResource.id,
      });
    }

    return {
      success: true,
    };
  }
}
