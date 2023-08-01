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
import duration from 'dayjs/plugin/duration';
import * as dayjs from 'dayjs';
import { DomtomEntity } from 'src/entities/domtom.entities';
// dayjs.extend(duration)

@Injectable()
export class UserPreferenceService {
  constructor(
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepo: Repository<UserPreferenceEntity>,
    private readonly dataSource: DataSource,
  ) {}

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
				T_USER_PREFERENCE_USP.patient_care_time
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
    const quote = this.dataSource
      .getRepository(UserPreferenceQuotationEntity)
      .findOne({ where: { usrId: userId } });
    const user = await this.dataSource
      .getRepository(UserEntity)
      .findOneOrFail({ where: { id: userId } });
    const setting = await this.userPreferenceRepo.findOneOrFail({
      where: { usrId: userId },
    });
    const mobileSetting = await this.dataSource
      .getRepository(MobileSettingEntity)
      .findOne({ where: { userId } });
    const domtom = await this.dataSource.getRepository(DomtomEntity).find();

    // preference.patient_care_time = dayjs.duration(preference?.patient_care_time).minutes()

    return {
      preference: preference,
      amo: amo,
      quote: quote,
      user: user,
      setting: setting,
      mobileSetting: mobileSetting,
      domtomDepartments: domtom,
    };
  }
}
