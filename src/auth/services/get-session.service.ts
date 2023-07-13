import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { LicenseEntity } from 'src/entities/license.entity';
import { PrivilegeEntity } from 'src/entities/privilege.entity';
import { ResourceEntity } from 'src/entities/resource.entity';
import { UserResourceEntity } from 'src/entities/user-resource.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import {
  SessionRes,
  UserPractitionersRes,
  UserResourceRes,
  UserUserRes,
} from '../reponse/session.res';
import { InjectRepository } from '@nestjs/typeorm';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';

@Injectable()
export class GetSessionService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserMedicalEntity)
    private userMedicalRepository: Repository<UserMedicalEntity>,
  ) {}

  async getSession(identity: UserIdentity) {
    const data = new SessionRes();
    const resources = await this.getResource(identity.id);
    data.resources = resources;
    data.user = await this.getUser(identity.id);
    data.practitioners = await this.getPractitioners(identity.id, identity.org);
    return data;
  }

  // php/session.php(line 32 - 120)
  async getUser(userId: number): Promise<UserUserRes> {
    const queryBuilder = this.dataSource.createQueryBuilder();

    const user: UserUserRes = await queryBuilder
      .select([
        'USR.USR_ID as id',
        'USR.USR_ADMIN as admin',
        'USR.USR_ABBR as abbr',
        'USR.USR_LASTNAME as lastname',
        'USR.USR_FIRSTNAME as firstname',
        'USR.USR_MAIL as email',
        'USR.USR_PHONE_NUMBER as phoneHome',
        'USR.USR_GSM as phoneMobile',
        'USR.USR_FAX_NUMBER as phoneFax',
        'USR.USR_PERMISSION_LIBRARY as permissionLibrary',
        'USR.USR_PERMISSION_PATIENT as permissionPatient',
        'USR.permission_patient_view',
        'USR.USR_PERMISSION_PASSWORD as permissionPassword',
        'USR.USR_PERMISSION_DELETE as permissionDelete',
        'USR.USR_AGA_MEMBER as agaMember',
        'USR.USR_DEPASSEMENT_PERMANENT as roit_permanent_depassement',
        'USR.USR_NUMERO_FACTURANT as numeroFacturant',
        'USR.finess as finess',
        'USR.USR_FLUX_CPS as fluxCps',
        'USR.USR_RATE_CHARGES as rateCharges',
        'USR.social_security_reimbursement_base_rate',
        'USR.social_security_reimbursement_rate',
        'USR.USR_BCB_LICENSE as bcbLicense',
        'USR.settings as settings',
        'USR.USR_SIGNATURE as signature',
        'USR.USR_TOKEN as token',
        'USR.organization_id',
      ])
      .from(UserEntity, 'USR')
      .where('USR.USR_ID = :userId', { userId })
      .getRawOne();

    const userPreferences = await queryBuilder
      .select([
        'USP.USR_ID as id',
        'USP.USP_LANGUAGE as language',
        'USP.USP_COUNTRY as country',
        'USP.USP_TIMEZONE as timezone',
        'USP.USP_VIEW as view',
        'USP.USP_DAYS as days',
        'USP.USP_WEEK_START_DAY as weekStartDay',
        'USP.USP_DISPLAY_HOLIDAY as displayHoliday',
        'USP.USP_DISPLAY_EVENT_TIME as displayEventTime',
        'USP.USP_DISPLAY_LAST_PATIENTS as displayLastPatients',
        'USP.USP_DISPLAY_PRACTITIONER_CALENDAR as displayPractitionerCalendar',
        'USP.USP_ENABLE_EVENT_PRACTITIONER_CHANGE as enableEventPractitionerChange',
        'USP.USP_FREQUENCY as frequency',
        'USP.USP_HMD as hmd',
        'USP.USP_HMF as hmf',
        'USP.USP_HAD as had',
        'USP.USP_HAF as haf',
        'USP.USP_HEIGHT_LINE as heightLine',
        'USP.USP_QUOTATION_DISPLAY_ODONTOGRAM as quotationDisplayOdontogram',
        'USP.USP_QUOTATION_DISPLAY_DETAILS as quotationDisplayDetails',
        'USP.USP_QUOTATION_DISPLAY_TOOLTIP as quotationDisplayTooltip',
        'USP.USP_QUOTATION_DISPLAY_DUPLICATA as quotationDisplayDuplicata',
        'USP.USP_QUOTATION_COLOR as quotationColor',
        'USP.USP_BILL_DISPLAY_TOOLTIP as billDisplayTooltip',
        'USP.USP_BILL_TEMPLATE as billTemplate',
        'USP.USP_ORDER_DISPLAY_TOOLTIP as orderDisplayTooltip',
        'USP.USP_ORDER_DUPLICATA as orderDuplicata',
        'USP.USP_ORDER_PREPRINTED_HEADER as orderPreprintedHeader',
        'USP.USP_ORDER_PREPRINTED_HEADER_SIZE as orderPreprintedHeaderSize',
        'USP.USP_ORDER_FORMAT as orderFormat',
        'USP.USP_ORDER_BCB_CHECK as orderBcbCheck',
        'USP.USP_THEME_CUSTOM as themeCustom',
        'USP.USP_THEME_COLOR as themeColor',
        'USP.USP_THEME_BGCOLOR as themeBgcolor',
        'USP.USP_THEME_BORDERCOLOR as themeBordercolor',
        'USP.USP_THEME_ASIDE_BGCOLOR as themeAsideBgcolor',
        'USP.USP_REMINDER_VISIT_DURATION as reminderVisitDuration',
        'USP.USP_CCAM_BRIDGE_QUICKENTRY as ccamBridgeQuickentry',
        'USP.ccam_price_list',
        'USP.patient_care_time',
        'USP.calendar_border_colored',
      ])
      .from('T_USER_PREFERENCE_USP', 'USP')
      .where('USP.USR_ID = :userId', { userId })
      .getRawOne();

    userPreferences.days = Array.from(
      String(userPreferences.days.toString(2)).split('').reverse(),
    )
      .map((digit, index) => (digit === '1' ? index : null))
      .filter((digit) => digit !== null);

    user.preference = userPreferences;

    let userEventTypes = await this.dataSource.query(
      `SELECT id, label, position,duration, color, is_visible FROM event_type WHERE user_id = ?`,
      [userId],
    );
    userEventTypes = userEventTypes.map((eventType) => ({
      ...eventType,
      is_visible: eventType.is_visible === 1 ? true : false,
    }));
    user.eventTypes = userEventTypes;

    const userMedical = await this.userMedicalRepository?.findOne({
      where: { userId },
    });
    user.rppsNumber = userMedical?.rppsNumber;
    return user;
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

  async getPractitioners(
    userId: number,
    orgId: number,
  ): Promise<UserPractitionersRes[]> {
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
