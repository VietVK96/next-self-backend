import { ApiProperty } from '@nestjs/swagger';

interface ReminderVisitRow {
  cell: Array<string>;
}

export class ReminderVisitRes {
  @ApiProperty()
  page?: number;

  @ApiProperty()
  rows?: Array<ReminderVisitRow>;

  @ApiProperty()
  total?: number;
}
