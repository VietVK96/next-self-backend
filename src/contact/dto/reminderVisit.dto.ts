import { ApiProperty } from '@nestjs/swagger';

interface ConditionItem {
  [key: string]: string;
}

export class ReminderVisitCount {
  total?: number;
}

export class ReminderVisitPhone {
  phoneNumber?: number;
}

export class ReminderVisitItem {
  id?: number;
  number?: number;
  lastname?: string;
  firstname?: string;
  message?: string;
  email?: string;
  dateOfLastReminder?: string;
  dateOfLastVisit?: string;
  dateOfNextReminder?: string;
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
