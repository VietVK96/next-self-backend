import { ApiProperty } from '@nestjs/swagger';

export class ReminderDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  appointment_reminder_library_id?: number;

  @ApiProperty()
  nbr?: number;

  @ApiProperty()
  reminderTypeId?: number;

  @ApiProperty()
  reminderTypeName?: string;

  @ApiProperty()
  reminderReceiverId?: number;

  @ApiProperty()
  reminderReceiverName?: string;

  @ApiProperty()
  reminderUnitId?: number;

  @ApiProperty()
  reminderUnitName?: string;

  @ApiProperty()
  reminderUnitNbr?: number;
}

export class HistoricalsDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  msg: string;

  @ApiProperty()
  xml: string;

  @ApiProperty()
  createdOn: string;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  userLastname: number;

  @ApiProperty()
  userFirstname: number;
}

export class TimeZoneDto {
  timeZone: string;
}
