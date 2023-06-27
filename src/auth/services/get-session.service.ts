import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { LicenseEntity } from 'src/entities/license.entity';
import { PrivilegeEntity } from 'src/entities/privilege.entity';
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
    data.practitioners = await this.getPractitioners(identity.org, identity.id);
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

  async getPractitioners(userId: number, orgId: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      USR.USR_ID as id,
      USR.USR_ADMIN as admin,
      USR.USR_ABBR as abbr,
      USR.USR_LASTNAME as lastname,
      USR.USR_FIRSTNAME as firstname,
      USR.USR_MAIL as email,
      USR.USR_PHONE_NUMBER as phoneHome,
      USR.USR_GSM as phoneMobile,
      USR.USR_FAX_NUMBER as phoneFax,
      USR.USR_AGA_MEMBER as agaMember,
      USR.USR_DEPASSEMENT_PERMANENT as droit_permanent_depassement,
      USR.USR_NUMERO_FACTURANT as numeroFacturant,
      USR.finess finess,
      USR.USR_FLUX_CPS as fluxCps,
      USR.USR_RATE_CHARGES as rateCharges,
      social_security_reimbursement_base_rate,
      social_security_reimbursement_rate,
      USR.USR_BCB_LICENSE as bcbLicense,
      USR.USR_SIGNATURE as signature,
      USR.USR_TOKEN as token,
      PVG.PVG_PERMISSION_BILLING as permissionBilling,
      PVG.PVG_PERMISSION_PAIEMENT as permissionPaiement,
      PVG.PVG_PERMISSION_ACCOUNTING as permissionAccounting,
      USR.color,
      resource.id as resourceId,
      resource.name as resourceName,
      USR.organization_id as groupId
    `;

    const qr = queryBuiler
      .select(select)
      .from(UserEntity, 'USR')
      .innerJoin(LicenseEntity, 'LIC', 'USR.USR_ID = LIC.USR_ID')
      .innerJoin(PrivilegeEntity, 'PVG', 'USR.USR_ID = PVG.USR_WITH_ID')
      .leftJoin(ResourceEntity, 'resource', 'resource.id = USR.resource_id')
      .where(
        'USR.organization_id = :orgId AND LIC.LIC_END >= CURDATE() AND PVG.USR_ID = :userId AND PVG.PVG_ENABLE = 1',
        {
          userId,
          orgId,
        },
      )
      .groupBy('USR.USR_LASTNAME, USR.USR_FIRSTNAME');
    return await qr.getRawMany();
  }
}
