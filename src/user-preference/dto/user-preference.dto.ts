import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserPreferenceDto {
  @ApiProperty()
  ccamPriceList?: number;

  @ApiProperty()
  displayLastPatients?: number;

  @ApiProperty()
  themeCustom?: number;

  @ApiProperty()
  themeColor?: number;

  @ApiProperty()
  themeBgcolor?: number;

  @ApiProperty()
  themeBordercolor?: number;

  @ApiProperty()
  themeAsideBgcolor?: number;

  @ApiProperty()
  reminderVisitDuration?: number;

  @ApiProperty()
  patient_care_time?: number;

  @ApiProperty()
  activateSendingAppointmentReminders?: boolean;

  @ApiProperty()
  displayAllWaitingRooms?: boolean;

  @ApiProperty()
  printAdditionalPatientInformation?: boolean;

  @ApiProperty()
  mobileSetting?: {
    sessionDuration?: number;
  };

  @ApiProperty()
  quote?: {
    period_of_validity?: number;
  };

  @ApiProperty()
  sesamVitaleModeDesynchronise?: number;

  @ApiProperty()
  amo?: {
    is_tp?: number;
  };

  @ApiProperty()
  domtom_id?: number;
}
