import { ApiProperty } from '@nestjs/swagger';

export interface ConditionItem {
  [key: string]: string;
}

export class ReminderVisitCount {
  total?: number;
}

export class ReminderVisitPhone {
  phoneNumber?: number;
  conId?: number;
}

export class ReminderVisitItemDto {
  id?: number;
  number?: number;
  lastname?: string;
  firstname?: string;
  message?: string;
  email?: string;
  dateOfLastReminder?: string;
  dateOfLastVisit?: string;
  dateOfNextReminder?: string;
  phone?: number;
}

export class ReminderVisitQuery {
  @ApiProperty()
  page?: number;

  @ApiProperty()
  rp?: number;

  @ApiProperty()
  conditions?: Array<ConditionItem>;

  @ApiProperty()
  user?: number;
}

export class ReminderVisitPrintQuery {
  @ApiProperty()
  conditions?: Array<ConditionItem>;

  @ApiProperty()
  user?: number;
}

export class ReminderVisitMailDto {
  @ApiProperty()
  contacts?: number[];

  @ApiProperty()
  documentMailId?: number;

  @ApiProperty()
  user?: number;
}

export class ReminderVisitSmsDto {
  @ApiProperty()
  patient_ids?: string[];

  @ApiProperty()
  user?: number;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  message?: string;
}

export class ReminderVisitEmailDto {
  @ApiProperty()
  patient_ids?: string[];

  @ApiProperty()
  user?: number;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  message?: string;
}
