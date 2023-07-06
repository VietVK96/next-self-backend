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
  hasRecurrEvents?: boolean;

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
  reminders?: { [key: string]: string }[];

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

// {
//   "color": -13327,
//   "backgroundColor": "#ffde00",
//   "textColor": "#000000",
//   "state": "1",
//   "lateness": false,
//   "rrule": null,
//   "dates": "",
//   "exdates": null,
//   "hasRecurrEvents": false,
//   "scp": "all",
//   "eventId": 347,
//   "practitionerId": "2",
//   "resourceId": "2",
//   "contactId": "1",
//   "id": 11332,
//   "name": "Contrôle sinh",
//   "start": "2023-07-09 00:00:00",
//   "end": "2023-07-09 23:59:00",
//   "msg": "",
//   "private": false,
//   "created_at": "2023-07-03 04:27:08",
//   "resourceName": "DENTISTE RPPS-ADELI Géraldine",
//   "eventTypeId": "10",
//   "eventTypeLabel": "Contrôle",
//   "practitionerLastname": "DENTISTE RPPS-ADELI",
//   "practitionerFirstname": "Géraldine",
//   "avatar_id": 49,
//   "contactNbr": 1,
//   "contactLastname": "SDGGDSDS",
//   "contactFirstname": "Dgdsgds",
//   "contactEmail": "",
//   "avatar_url": "https://ecoo.ltsgroup.tech/php/contact/avatar.php?id=1",
//   "reminders": [],
//   "historicals": [],
//   "allday": false
// }

// {
//   "color": -12303,
//   "backgroundColor": "#ffc600",
//   "textColor": "#000000",
//   "state": "0",
//   "lateness": false,
//   "rrule": null,
//   "dates": "",
//   "exdates": "",
//   "hasRecurrEvents": false,
//   "scp": "all",
//   "eventId": null,
//   "practitionerId": "1",
//   "resourceId": "1",
//   "contactId": "120",
//   "start": "2023-02-05 16:00:00",
//   "end": "2023-02-05 16:30:00",
//   "name": "",
//   "msg": "",
//   "allday": false,
//   "private": false,
//   "eventTypeId": "",
//   "reminders": [
//       {
//           "id": "0",
//           "nbr": "1",
//           "appointment_reminder_library_id": "1",
//           "reminderTypeId": "1",
//           "reminderReceiverId": "1",
//           "reminderUnitId": "3"
//       }
//   ]
// }
