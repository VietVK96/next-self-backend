/**
 * Repositories/Group.php
 */
import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { UserSmsEntity } from 'src/entities/user-sms.entity';
import { UserEntity } from 'src/entities/user.entity';
import { UserService } from 'src/user/services/user.service';
import { DataSource, Not, Repository } from 'typeorm';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountStatusEnum } from 'src/enum/account-status.enum';

@Injectable()
export class OrganizationService {
  constructor(
    private dataSource: DataSource,
    private userService: UserService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
  ) {}

  private async _getPractitioners(organizationId: number) {
    const user = await this.userRepository.find({
      where: {
        client: Not(AccountStatusEnum.TERMINATED),
        organizationId,
      },
      relations: {
        medical: true,
        eventTypes: true,
        setting: true,
      },
      order: {
        lastname: 'ASC',
        firstname: 'ASC',
      },
    });

    return user.filter((x) => x.medical);
  }

  async hasStorageSpace(groupId: number, size?: number): Promise<boolean> {
    const queryBuilder = this.dataSource.createQueryBuilder();
    queryBuilder
      .select('GRP.totalStorageSpace - GRP.storageSpaceUsed', 'remainingSpace')
      .from(OrganizationEntity, 'GRP')
      .where('GRP.id = :groupId', { groupId });

    const result = await queryBuilder.getRawOne();
    const remainingSpace = result?.remainingSpace ?? 0;

    if (typeof size === 'number') {
      return remainingSpace - size > 0;
    }

    return remainingSpace > 0;
  }

  async getStorageSpace(
    groupId: number,
  ): Promise<{ totalStorageSpace: number; storageSpaceUsed: number }> {
    const queryBuilder = this.dataSource.createQueryBuilder();
    return queryBuilder
      .select('GRP.totalStorageSpace', 'totalStorageSpace')
      .addSelect('GRP.storageSpaceUsed', 'storageSpaceUsed')
      .from(OrganizationEntity, 'GRP')
      .where('GRP.id = :groupId', { groupId })
      .getRawOne();
  }

  async getSmsQuantity(organizationId: number) {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const smsQuantity = await queryBuilder
      .select(
        `
        SUM(sms.quantity)
        `,
        'smsQuantity',
      )
      .from(OrganizationEntity, 'organization')
      .innerJoin(UserEntity, 'users', 'users.organizationId = organization.id')
      .innerJoin(UserSmsEntity, 'sms', 'sms.usrId = users.id')
      .where('organization.id = :organizationId', { organizationId })
      .getRawOne();

    return smsQuantity;
  }

  async infoOrganization(orgId: number) {
    const queryBuilder = this.dataSource.createQueryBuilder();

    return await queryBuilder
      .select(
        `organization.id, organization.smsSharing, organization.storageSpaceUsed, organization.totalStorageSpace`,
      )
      .from(OrganizationEntity, 'organization')
      .where('organization.id = :orgId', { orgId })
      .getRawOne();
  }

  async userByOrgId(orgId: number) {
    const queryBuilder = this.dataSource.createQueryBuilder();

    return await queryBuilder
      .select(`users.id, users.lastname, users.firstname`)
      .from(UserEntity, 'users')
      .where('users.organizationId = :orgId', { orgId })
      .innerJoin(UserMedicalEntity, 'medical', 'medical.user_id = users.id')
      .getRawMany();
  }

  async about(identity: UserIdentity) {
    const organization = await this.infoOrganization(identity.org);
    const userOrg = await this.userByOrgId(identity.org);
    const userUnique = userOrg.filter((object, index, arr) => {
      return index === arr.findIndex((item) => item.USR_ID === object.USR_ID);
    });
    organization.users = userUnique;
    const smsQuantityO = await this.getSmsQuantity(identity.org);
    organization.smsQuantity = smsQuantityO.smsQuantity || 0;

    for (const user of organization.users) {
      const smsQuantity = await this.userService.getSmsQuantity(user.USR_ID);
      user.smsQuantity = smsQuantity.smsQuantity || 0;
    }

    const user = await this.userService.find(identity.id);
    const packageJson = fs.readFileSync(
      `${process.cwd()}/package.json`,
      'utf8',
    );
    const packageData = JSON.parse(packageJson);
    const versionNumber = packageData.version;

    return { organization, user, versionNumber };
  }

  async getCurrentOrganization(organizationId: number) {
    if (organizationId) {
      const currentOrganization = await this.organizationRepo.findOneOrFail({
        where: { id: organizationId },
        relations: { address: true, logo: true },
      });
      const practitioners = await this._getPractitioners(organizationId);
      const modeDesynchronise = practitioners.every(
        (x) => x.setting.sesamVitaleModeDesynchronise,
      );
      return {
        organization: currentOrganization,
        modeDesynchronise,
      };
    }
  }

  /**
   * Additional api to optimize performance
   */
  async getSettingsObservation(organizationId: number) {
    const res = await this.organizationRepo.findOneOrFail({
      select: ['settings'],
      where: { id: organizationId },
    });
    return res;
  }
}
