import { ApiProperty } from '@nestjs/swagger';

export class SaveAgendaDto {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  backgroundColor?: string;

  @ApiProperty()
  textColor?: string;

  @ApiProperty()
  state?: string;

  @ApiProperty()
  lateness?: boolean;

  @ApiProperty()
  rrule?: string;

  @ApiProperty()
  dates?: string;

  @ApiProperty()
  exdates?: string;

  @ApiProperty()
  hasRecurrEvents?: boolean | string;

  @ApiProperty()
  scp?: string;

  @ApiProperty()
  eventId?: string;

  @ApiProperty()
  practitionerId?: string;

  @ApiProperty()
  resourceId?: string;

  @ApiProperty()
  contactId?: string;

  @ApiProperty()
  start?: string;

  @ApiProperty()
  end?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  msg?: string;

  @ApiProperty()
  allday?: boolean;

  @ApiProperty()
  private?: boolean;

  @ApiProperty()
  eventTypeId?: string;

  @ApiProperty()
  eventTypeLabel?: string;

  @ApiProperty()
  reminders?: reminder[];

  @ApiProperty()
  created_at?: string;

  @ApiProperty()
  resourceName?: string;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  avatar_id?: number;

  @ApiProperty()
  contactNbr?: number;

  @ApiProperty()
  contactLastname?: number;

  @ApiProperty()
  contactFirstname?: number;

  @ApiProperty()
  contactEmail?: string;

  @ApiProperty()
  avatar_url?: string;

  @ApiProperty()
  historicals?: { [key: string]: string }[];
}

class reminder {
  id?: number | null;
  nbr?: string | number;
  appointment_reminder_library_id?: number | null;
  reminderTypeId?: number;
  reminderReceiverId?: number;
  reminderUnitId?: number;
}
