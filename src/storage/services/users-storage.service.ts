import { Injectable } from '@nestjs/common';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { DataSource } from 'typeorm';
import { StorageService } from './storage.service';
import { StringHelper } from 'src/common/util/string-helper';
import { ErrorCode } from 'src/constants/error';
import { UpdateStoragePackDto, UsersStorageDto } from '../dto/storage-pack.dto';

@Injectable()
export class UsersStorageSpace {
  constructor(
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
  ) {}

  async findGroupById(id: number) {
    const query = this.dataSource
      .getRepository(OrganizationEntity)
      .createQueryBuilder('group');
    query.select([
      'group.id as id',
      'group.storageSpaceUsed as storageSpaceUsed',
      'group.totalStorageSpace as totalStorageSpace',
    ]);
    query.where('group.id = :id', { id });
    const group = await query.getRawOne();

    if (group) {
      const storageSpaceUsedPercent =
        Math.round(
          ((Number(group.storageSpaceUsed) * 100) /
            Number(group.totalStorageSpace)) *
            100,
        ) / 100;
      console.log(storageSpaceUsedPercent);
      group['storageSpaceUsedPercent'] = storageSpaceUsedPercent;
    }

    return group;
  }

  async findAllUserByGroup(groupId: number) {
    const users = await this.dataSource.query(
      `
    SELECT
        T_USER_USR.USR_ID AS id,
        T_USER_USR.USR_ABBR AS short_name,
        T_USER_USR.USR_LASTNAME AS lastname,
        T_USER_USR.USR_FIRSTNAME AS firstname,
        T_LICENSE_LIC.LIC_END AS end_of_license_at,
        T_USER_TYPE_UST.UST_PRO AS professional
    FROM T_USER_USR
    LEFT OUTER JOIN T_LICENSE_LIC ON T_LICENSE_LIC.USR_ID = T_USER_USR.USR_ID AND T_USER_USR.USR_CLIENT = 0
    LEFT OUTER JOIN T_USER_TYPE_UST ON T_USER_TYPE_UST.UST_ID = T_USER_USR.UST_ID
    WHERE T_USER_USR.organization_id = ?`,
      [groupId],
    );
    return users;
  }

  //File /fsd/users/storage.php
  async getStorageSpaceManagement(groupId: number) {
    try {
      const group = await this.findGroupById(groupId);
      const users = await this.findAllUserByGroup(groupId);
      const packs = await this.storageService.getListByGroup(groupId);
      const total = await packs.reduce((memo, pack) => {
        return memo + Number(pack.quantity) * Number(pack.price);
      }, 0);

      return {
        group,
        users,
        packs: packs,
        total,
      };
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }

  //File /fsd/users/storage.php
  async updateStorageSpaceManagement(
    groupId: number,
    payload: UsersStorageDto,
  ) {
    try {
      if (payload && payload.quantities && payload.confirm) {
        for (const [index, quantity] of payload.quantities.entries()) {
          await this.dataSource.query(
            `
                INSERT INTO T_STORAGE_SPACE_STS (GRP_ID, STK_ID, STS_QUANTITY)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                STS_QUANTITY = VALUES(STS_QUANTITY)
                `,
            [groupId, index + 1, Math.max(0, quantity)],
          );
        }
      }
      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }
}
