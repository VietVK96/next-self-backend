import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserAmoEntity } from 'src/entities/user-amo.entity';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { UserEntity } from 'src/entities/user.entity';
import { MobileSettingEntity } from 'src/entities/mobile-setting.entity';
import { DomtomEntity } from 'src/entities/domtom.entities';
import { UpdateUserPreferenceDto } from '../dto/user-preference.dto';
import { UserMedicalEntity } from 'src/entities/user-medical.entity';
import { SuccessResponse } from 'src/common/response/success.res';

@Injectable()
export class UserPreferenceService {
  constructor(
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepo: Repository<UserPreferenceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private _convertHourToMinute(timeInHour) {
    const timeParts = timeInHour.split(':');
    return Number(timeParts[0]) * 60 + Number(timeParts[1]);
  }

  private _convertMinuteToHour(MINUTES) {
    const m = MINUTES % 60;
    const h = (MINUTES - m) / 60;
    const HHMM =
      (h < 10 ? '0' : '') +
      h.toString() +
      ':' +
      (m < 10 ? '0' : '') +
      m.toString() +
      ':' +
      '00';
    return HHMM;
  }

  async find(userId: number) {
    const stm = `
      SELECT
				T_USER_PREFERENCE_USP.USP_LANGUAGE AS language,
				T_USER_PREFERENCE_USP.USP_COUNTRY AS country,
				T_USER_PREFERENCE_USP.USP_TIMEZONE AS timezone,
				T_USER_PREFERENCE_USP.USP_THEME_CUSTOM AS theme,
				T_USER_PREFERENCE_USP.USP_THEME_COLOR AS theme_color,
				T_USER_PREFERENCE_USP.USP_THEME_BGCOLOR AS theme_background_color,
				T_USER_PREFERENCE_USP.USP_THEME_BORDERCOLOR AS theme_border_color,
				T_USER_PREFERENCE_USP.USP_THEME_ASIDE_BGCOLOR AS theme_aside_color,
				T_USER_PREFERENCE_USP.USP_DISPLAY_LAST_PATIENTS AS display_recently_treated,
				T_USER_PREFERENCE_USP.USP_REMINDER_VISIT_DURATION AS reminder_visit_duration,
				T_USER_PREFERENCE_USP.ccam_price_list,
				T_USER_PREFERENCE_USP.patient_care_time,
				T_USER_PREFERENCE_USP.sesam_vitale_mode_desynchronise
			FROM T_USER_PREFERENCE_USP
			WHERE T_USER_PREFERENCE_USP.USR_ID = ?`;

    const preferences = await this.dataSource.query(stm, [userId]);
    return preferences[0];
  }

  async getByUser(userId: number) {
    if (!userId) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }

    const preference = await this.find(userId);
    const amo = await this.dataSource
      .getRepository(UserAmoEntity)
      .findOne({ where: { userId } });
    const quote = await this.dataSource
      .getRepository(UserPreferenceQuotationEntity)
      .findOne({ where: { usrId: userId } });
    const user = await this.dataSource.getRepository(UserEntity).findOneOrFail({
      where: { id: userId },
      relations: { medical: { domtom: true } },
    });
    const mobileSetting = await this.dataSource
      .getRepository(MobileSettingEntity)
      .findOne({ where: { userId } });
    const domtom = await this.dataSource.getRepository(DomtomEntity).find();

    preference.patient_care_time = this._convertHourToMinute(
      preference.patient_care_time,
    );
    return {
      preference: preference,
      amo: { isTp: amo?.isTp },
      quote: { periodOfValidity: quote?.periodOfValidity },
      user: {
        settings: user?.settings,
        medical: { domtom: user?.medical?.domtom },
      },
      mobileSetting: { sessionDuration: mobileSetting?.sessionDuration },
      domtomDepartments: domtom,
    };
  }

  async update(
    userId: number,
    body: UpdateUserPreferenceDto,
    organizationId: number,
  ): Promise<SuccessResponse> {
    const {
      ccamPriceList,
      displayLastPatients,
      themeCustom,
      themeColor,
      themeBgcolor,
      themeBordercolor,
      themeAsideBgcolor,
      reminderVisitDuration,
      patient_care_time,
      sesamVitaleModeDesynchronise,
    } = body;

    const patientCareTime = this._convertMinuteToHour(patient_care_time);

    const userPreferenceEntity = await this.userPreferenceRepo.findOne({
      where: { usrId: userId },
    });
    userPreferenceEntity.priceGrid = ccamPriceList;
    userPreferenceEntity.displayLastPatients = displayLastPatients;
    userPreferenceEntity.themeCustom = themeCustom;
    userPreferenceEntity.reminderVisitDuration = reminderVisitDuration;
    userPreferenceEntity.patientCareTime = patientCareTime;
    userPreferenceEntity.themeColor = themeColor;
    userPreferenceEntity.themeBgcolor = themeBgcolor;
    userPreferenceEntity.themeBordercolor = themeBordercolor;
    userPreferenceEntity.themeAsideBgcolor = themeAsideBgcolor;
    userPreferenceEntity.sesamVitaleModeDesynchronise =
      sesamVitaleModeDesynchronise;

    await this.userPreferenceRepo.save(userPreferenceEntity);

    let mobileSetting = await this.dataSource
      .getRepository(MobileSettingEntity)
      .findOne({ where: { userId } });

    if (!mobileSetting) {
      mobileSetting = new MobileSettingEntity();
      mobileSetting.groupId = organizationId;
      mobileSetting.userId = userId;
    }

    mobileSetting.sessionDuration = body?.mobileSetting?.sessionDuration;
    await this.dataSource
      .getRepository(MobileSettingEntity)
      .save(mobileSetting);

    const quote = await this.dataSource
      .getRepository(UserPreferenceQuotationEntity)
      .findOne({ where: { usrId: userId } });
    quote.periodOfValidity = body?.quote?.period_of_validity;
    await this.dataSource
      .getRepository(UserPreferenceQuotationEntity)
      .save(quote);

    const amo = await this.dataSource
      .getRepository(UserAmoEntity)
      .findOne({ where: { userId } });
    if (amo) {
      amo.isTp = body?.amo?.is_tp;
      await this.dataSource.getRepository(UserAmoEntity).save(amo);
    }

    const user = await this.dataSource.getRepository(UserEntity).findOneOrFail({
      where: { id: userId },
      relations: { medical: { domtom: true } },
    });
    const medical = user?.medical;
    if (medical) {
      medical.domtomId = body?.domtom_id;
    }

    await this.dataSource.getRepository(UserMedicalEntity).save(medical);
    user.settings = {
      ...user?.settings,
      activateSendingAppointmentReminders:
        !!body?.activateSendingAppointmentReminders,
      displayAllWaitingRooms: !!body?.displayAllWaitingRooms,
      printAdditionalPatientInformation:
        !!body?.printAdditionalPatientInformation,
    };

    await this.dataSource.getRepository(UserEntity).save(user);

    return {
      success: true,
    };
  }
}
