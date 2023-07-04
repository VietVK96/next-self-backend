import { Injectable } from '@nestjs/common';
import { SaveEventPayloadDto } from '../dto/save.event.dto';
import { Connection, DataSource } from 'typeorm';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import { UserEntity } from 'src/entities/user.entity';

@Injectable()
export class SaveEventService {
  constructor(private readonly connection: Connection) {}

  convertArrayToInteger(array: number[]): number {
    return array.reduce((acc, value) => acc | (1 << value), 0);
  }

  async save(id: number, payload: SaveEventPayloadDto) {
    const { settings, ...userPreferencePayload } = payload;

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const selectSettings = await queryRunner.manager
        .createQueryBuilder()
        .select('settings')
        .from(UserEntity, 'USR')
        .where('USR_ID = :id', { id })
        .getRawOne();

      const formatSelectSetting = {
        eventTitleFormat: settings.eventTitleFormat,
        displayAllWaitingRooms: selectSettings.settings.displayAllWaitingRooms,
        printAdditionalPatientInformation:
          selectSettings.settings.printAdditionalPatientInformation,
        activateSendingAppointmentReminders:
          selectSettings.settings.activateSendingAppointmentReminders,
      };

      await queryRunner.manager
        .createQueryBuilder()
        .update(UserEntity)
        .set({ settings: formatSelectSetting })
        .where('USR_ID = :id', { id })
        .execute();

      const updateResult = await queryRunner.manager
        .createQueryBuilder()
        .update(UserPreferenceEntity)
        .set({
          usrId: userPreferencePayload.id,
          language: userPreferencePayload.language,
          country: userPreferencePayload.country,
          timezone: userPreferencePayload.timezone,
          view: userPreferencePayload.view,
          days: this.convertArrayToInteger(userPreferencePayload.days),
          weekStartDay: userPreferencePayload.weekStartDay,
          displayHoliday: userPreferencePayload.displayHoliday,
          displayEventTime: userPreferencePayload.displayEventTime,
          displayLastPatients: userPreferencePayload.displayLastPatients,
          displayPractitionerCalendar:
            userPreferencePayload.displayPractitionerCalendar,
          enableEventPractitionerChange:
            userPreferencePayload.enableEventPractitionerChange,
          frequency: userPreferencePayload.frequency,
          hmd: userPreferencePayload.hmd,
          hmf: userPreferencePayload.hmf,
          had: userPreferencePayload.had,
          haf: userPreferencePayload.haf,
          heightLine: userPreferencePayload.heightLine,
          quotationDisplayOdontogram:
            userPreferencePayload.quotationDisplayOdontogram,
          quotationDisplayDetails:
            userPreferencePayload.quotationDisplayDetails,
          quotationDisplayTooltip:
            userPreferencePayload.quotationDisplayTooltip,
          quotationDisplayDuplicata:
            userPreferencePayload.quotationDisplayDuplicata,
          quotationColor: userPreferencePayload.quotationColor,
          billDisplayTooltip: userPreferencePayload.billDisplayTooltip,
          billTemplate: userPreferencePayload.billTemplate,
          orderDisplayTooltip: userPreferencePayload.orderDisplayTooltip,
          orderDuplicata: userPreferencePayload.orderDuplicata,
          orderPreprintedHeader: userPreferencePayload.orderPreprintedHeader,
          orderPreprintedHeaderSize:
            userPreferencePayload.orderPreprintedHeaderSize,
          orderFormat: userPreferencePayload.orderFormat,
          orderBcbCheck: userPreferencePayload.orderBcbCheck,
          themeCustom: userPreferencePayload.themeCustom,
          themeColor: userPreferencePayload.themeColor,
          themeBgcolor: userPreferencePayload.themeBgcolor,
          themeBordercolor: userPreferencePayload.themeBordercolor,
          themeAsideBgcolor: userPreferencePayload.themeAsideBgcolor,
          reminderVisitDuration: userPreferencePayload.reminderVisitDuration,
          ccamBridgeQuickentry: userPreferencePayload.ccamBridgeQuickentry,
          ccamPriceList: userPreferencePayload.ccam_price_list,
          patientCareTime: userPreferencePayload.patient_care_time,
          calendarBorderColored: userPreferencePayload.calendar_border_colored,
        })
        .where('USR_ID = :id', { id })
        .execute();

      await queryRunner.commitTransaction();
      return updateResult.raw;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
