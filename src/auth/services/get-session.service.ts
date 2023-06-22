import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { LicenseEntity } from 'src/entities/license.entity';
import { ResourceEntity } from 'src/entities/resource.entity';
import { UserResourceEntity } from 'src/entities/user-resource.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import { SessionRes, UserResourceRes } from '../reponse/session.res';

@Injectable()
export class GetSessionService {
  constructor(private dataSource: DataSource) {}

  async getSession(identity: UserIdentity) {
    const data = new SessionRes();
    const resources = await this.getResource(identity.id);
    data.resources = resources;
    return data;
  }

  async getResource(userId: number): Promise<UserResourceRes[]> {
    const queryBuiler = this.dataSource.createQueryBuilder();

    const selectResource = `
        resource.id,
        resource.user_id as doctorId,
        resource.name,
        resource.color,
        resource.use_default_color,
        resource.user_id,
        T_USER_USR.USR_ID AS practitionerId,
        CONCAT_WS(' ', T_USER_USR.USR_LASTNAME, T_USER_USR.USR_FIRSTNAME) AS practitionerName,
        USR1.color AS owner_color`;
    const getResourceQr = queryBuiler
      .select(selectResource)
      .from(ResourceEntity, 'resource')
      .innerJoin(
        UserResourceEntity,
        'user_resource',
        'user_resource.resource_id = resource.id',
      )
      .innerJoin(
        UserEntity,
        'T_USER_USR',
        'user_resource.user_id = T_USER_USR.USR_ID',
      )
      .innerJoin(
        LicenseEntity,
        'T_LICENSE_LIC',
        'T_USER_USR.USR_ID = T_LICENSE_LIC.USR_ID',
      )
      .leftJoin(UserEntity, 'USR1', 'USR1.USR_ID = resource.user_id')
      .andWhere('user_resource.user_id = :userId', {
        userId,
      })
      .orderBy('resource.name');

    const data: UserResourceRes[] = await getResourceQr.getRawMany();
    return data;
  }
}
