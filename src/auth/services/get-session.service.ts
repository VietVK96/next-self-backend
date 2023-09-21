import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { LicenseEntity } from 'src/entities/license.entity';
import { PrivilegeEntity } from 'src/entities/privilege.entity';
import { ResourceEntity } from 'src/entities/resource.entity';
import { UserResourceEntity } from 'src/entities/user-resource.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository, In } from 'typeorm';
import {
  SessionRes,
  UserPractitionersRes,
  UserResourceRes,
  UserUserRes,
  UserUserSettingRes,
} from '../reponse/session.res';
import { InjectRepository } from '@nestjs/typeorm';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { parseJson } from 'src/common/util/json';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { UserAmoEntity } from 'src/entities/user-amo.entity';

@Injectable()
export class GetSessionService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserMedicalEntity)
    private userMedicalRepository: Repository<UserMedicalEntity>,
    @InjectRepository(UserAmoEntity)
    private userAmoRepo: Repository<UserAmoEntity>,
  ) {}

  async getSession(identity: UserIdentity) {
    const data = new SessionRes();
    const resources = await this.getResource(identity.id);
    data.resources = resources;
    data.user = await this.getUser(identity.id);
    data.practitioners = await this.getPractitioners(identity.id, identity.org);
    data.users = await this.getUsers(identity.id, identity.org);
    return data;
  }

  // php/session.php(line 32 - 120)
  async getUser(userId: number): Promise<UserUserRes> {
    const queryBuilder = this.dataSource.createQueryBuilder();

    const userResult = await queryBuilder
      .select([
        'USR.USR_ID as id',
        'USR.USR_ADMIN as admin',
        'USR.USR_ABBR as abbr',
        'USR.USR_LASTNAME as lastname',
        'USR.USR_FIRSTNAME as firstname',
        'USR.color as color',
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

    let userSettings = userResult?.settings as UserUserSettingRes | string;
    if (
      userSettings &&
      userSettings !== '' &&
      typeof userSettings === 'string'
    ) {
      userSettings = parseJson<UserUserSettingRes>(userResult?.settings);
    }
    const user: UserUserRes = {
      ...userResult,
      settings: userSettings,
    };
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
    user.national_identifier_number = userMedical?.nationalIdentifierNumber;
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
      USR.settings as settings,
      USR.USR_TOKEN as token,
      PVG.PVG_PERMISSION_BILLING as permissionBilling,
      PVG.PVG_PERMISSION_PAIEMENT as permissionPaiement,
      PVG.PVG_PERMISSION_ACCOUNTING as permissionAccounting,
      USR.color,
      resource.id as resourceId,
      resource.name as resourceName,
      USR.organization_id as groupId,
      medical.id as medical_id,
      medical.finess_number as medical_finess_number,
      medical.national_identifier_number as medical_national_identifier_number,
      medical.rpps_number as medical_rpps_number
    `;

    const qr = queryBuiler
      .select(select)
      .from(UserEntity, 'USR')
      .innerJoin(LicenseEntity, 'LIC', 'USR.USR_ID = LIC.USR_ID')
      .innerJoin(PrivilegeEntity, 'PVG', 'USR.USR_ID = PVG.USR_WITH_ID')
      .leftJoin(ResourceEntity, 'resource', 'resource.id = USR.resource_id')
      .leftJoin(UserMedicalEntity, 'medical', 'USR.USR_ID = medical.user_id')
      .where(
        'USR.organization_id = :orgId AND LIC.LIC_END >= CURDATE() AND PVG.USR_ID = :userId AND PVG.PVG_ENABLE = 1',
        {
          userId,
          orgId,
        },
      )
      .groupBy('USR.USR_LASTNAME, USR.USR_FIRSTNAME');
    const data = await qr.getRawMany();
    const practitionerIds = data.map((d) => d.id);
    const preferences = await this.getPreference(practitionerIds);
    const amos = await this.getAmo(practitionerIds);
    const medicals = await this.getMedical(practitionerIds);
    const eventTypesRes = await this.getEventTypes(practitionerIds);

    const dataReturn = data.map((d) => {
      const preference = preferences.find((p) => p.id === d.id);
      const amo = amos.find((a) => a.userId === d.id);
      const medical = medicals.find((m) => m.userId === d.id);
      const eventTypes = eventTypesRes.find(
        (event) => event.pracId === d.id,
      )?.eventTypes;
      let userSettings = d?.settings as UserUserSettingRes | string;
      if (
        userSettings &&
        userSettings !== '' &&
        typeof userSettings === 'string'
      ) {
        userSettings = parseJson<UserUserSettingRes>(d?.settings);
      }
      return {
        ...d,
        preference,
        amo,
        medical,
        eventTypes,
        settings: userSettings,
      };
    });
    return dataReturn;
  }

  async getEventTypes(practitionerIds: number[]) {
    if (!practitionerIds || practitionerIds.length === 0) {
      return [];
    }
    const dataReturn = [];
    for (const pracId of practitionerIds) {
      let userEventTypes = await this.dataSource.query(
        `SELECT id, label, position, duration, color, is_visible 
        FROM event_type WHERE user_id = ? AND deleted_at IS NULL
        ORDER BY position`,
        [pracId],
      );
      userEventTypes = userEventTypes.map((eventType) => ({
        ...eventType,
        is_visible: eventType.is_visible === 1 ? true : false,
      }));

      dataReturn.push({
        pracId: +pracId,
        eventTypes: userEventTypes,
      });
    }
    return dataReturn;
  }

  async getPreference(practitionerIds: number[]) {
    if (!practitionerIds || practitionerIds.length === 0) {
      return [];
    }
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      USR_ID as id,
      USP_LANGUAGE as language,
      USP_COUNTRY as country,
      USP_TIMEZONE as timezone,
      USP_VIEW as view,
      USP_DAYS as days,
      USP_WEEK_START_DAY as weekStartDay,
      USP_DISPLAY_HOLIDAY as displayHoliday,
      USP_DISPLAY_EVENT_TIME as displayEventTime,
      USP_DISPLAY_LAST_PATIENTS as displayLastPatients,
      USP_DISPLAY_PRACTITIONER_CALENDAR as displayPractitionerCalendar,
      USP_ENABLE_EVENT_PRACTITIONER_CHANGE as enableEventPractitionerChange,
      USP_FREQUENCY as frequency,
      USP_HMD as hmd,
      USP_HMF as hmf,
      USP_HAD as had,
      USP_HAF as haf,
      USP_HEIGHT_LINE as heightLine,
      USP_QUOTATION_DISPLAY_ODONTOGRAM as quotationDisplayOdontogram,
      USP_QUOTATION_DISPLAY_DETAILS as quotationDisplayDetails,
      USP_QUOTATION_DISPLAY_TOOLTIP as quotationDisplayTooltip,
      USP_QUOTATION_DISPLAY_DUPLICATA as quotationDisplayDuplicata,
      USP_QUOTATION_COLOR as quotationColor,
      USP_BILL_DISPLAY_TOOLTIP as billDisplayTooltip,
      USP_BILL_TEMPLATE as billTemplate,
      USP_ORDER_DISPLAY_TOOLTIP as orderDisplayTooltip,
      USP_ORDER_DUPLICATA as orderDuplicata,
      USP_ORDER_PREPRINTED_HEADER as orderPreprintedHeader,
      USP_ORDER_PREPRINTED_HEADER_SIZE as orderPreprintedHeaderSize,
      USP_ORDER_FORMAT as orderFormat,
      USP_ORDER_BCB_CHECK as orderBcbCheck,
      USP_THEME_CUSTOM as themeCustom,
      USP_THEME_COLOR as themeColor,
      USP_THEME_BGCOLOR as themeBgcolor,
      USP_THEME_BORDERCOLOR as themeBordercolor,
      USP_THEME_ASIDE_BGCOLOR as themeAsideBgcolor,
      USP_REMINDER_VISIT_DURATION as reminderVisitDuration,
      USP_CCAM_BRIDGE_QUICKENTRY as ccamBridgeQuickentry,
      ccam_price_list,
      DATE_FORMAT(patient_care_time, '%H:%i') as patient_care_time
    `;

    const qr = queryBuiler
      .select(select)
      .from(UserPreferenceEntity, 'USP')
      .where('USP.USR_ID IN (:practitionerIds)', {
        practitionerIds,
      });
    return await qr.getRawMany();
  }

  async getAmo(practitionerIds: number[]) {
    if (!practitionerIds || practitionerIds.length === 0) {
      return [];
    }
    return await this.userAmoRepo.find({
      where: {
        userId: In(practitionerIds),
      },
    });
  }

  async getMedical(practitionerIds: number[]) {
    if (!practitionerIds || practitionerIds.length === 0) {
      return [];
    }
    return await this.userMedicalRepository.find({
      where: {
        userId: In(practitionerIds),
      },
    });
  }

  // php/session.php(line 123 - 136)
  async getUsers(userId: number, orgId: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `    USR.USR_ID AS id,
    USR.USR_LASTNAME AS lastname,
    USR.USR_FIRSTNAME AS firstname,
    USR.USR_ABBR AS shortname`;
    queryBuiler
      .select(select)
      .from(UserEntity, 'USR')
      .innerJoin(
        LicenseEntity,
        'T_LICENSE_LIC',
        'USR.USR_ID = T_LICENSE_LIC.USR_ID',
      )
      .where(
        'USR.organization_id = :orgId AND USR.USR_ID != :userId AND USR.USR_ID = T_LICENSE_LIC.USR_ID AND T_LICENSE_LIC.LIC_END >= CURDATE()',
        {
          orgId,
          userId,
        },
      )
      .orderBy('USR.USR_LASTNAME, USR.USR_FIRSTNAME');
    return await queryBuiler.getRawMany();
  }
}
