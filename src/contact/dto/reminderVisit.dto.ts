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
