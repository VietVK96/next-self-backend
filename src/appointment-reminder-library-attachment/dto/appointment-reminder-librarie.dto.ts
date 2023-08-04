import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentReminderLibrarieQueryDto {
  @ApiProperty()
  category?: string;
  timelimit?: number;
  timelimit_unit?: string;
  attachments?: number[];
  update_all_future_appointments?: number;
}

export class AppointmentReminderLibrarieDto {
  @ApiProperty()
  id?: number;
  attachmentCount?: number;
  addressee?: {
    id?: number;
    name?: string;
  };
  category?: {
    id?: number;
    name?: string;
  };
  timelimitUnit?: {
    id?: number;
    name?: string;
    nbr?: number;
  };
}
