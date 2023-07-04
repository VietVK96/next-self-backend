import { ApiProperty } from '@nestjs/swagger';
import { HistoricalsDto, ReminderDto } from '../dto/find.event.dto';

export class FindEventByIdRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  eventId?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  start?: string;

  @ApiProperty()
  end?: string;

  @ApiProperty()
  msg?: string;

  @ApiProperty()
  private?: number;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  state?: number;

  @ApiProperty()
  lateness?: number;

  @ApiProperty()
  rrule?: string;

  @ApiProperty()
  created_at?: string;

  @ApiProperty()
  hasRecurrEvents?: number;

  @ApiProperty()
  resourceId?: number;

  @ApiProperty()
  resourceName?: string;

  @ApiProperty()
  eventTypeId?: number;

  @ApiProperty()
  eventTypeLabel?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  contactId?: number;

  @ApiProperty()
  avatar_id?: number;

  @ApiProperty()
  contactNbr?: number;

  @ApiProperty()
  contactLastname?: string;

  @ApiProperty()
  contactFirstname?: string;

  @ApiProperty()
  contactEmail?: string;

  @ApiProperty()
  dates?: string;

  @ApiProperty()
  exdates?: string;

  @ApiProperty()
  backgroundColor?: string;

  @ApiProperty()
  textColor?: string;

  @ApiProperty()
  avatar_url?: string;

  @ApiProperty()
  reminders?: ReminderDto[];

  @ApiProperty()
  historicals?: HistoricalsDto[];
}
