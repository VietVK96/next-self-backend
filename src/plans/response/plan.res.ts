import { ApiProperty } from '@nestjs/swagger';

export class FindAllPlanItemRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  acceptedAt?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  createdAt?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  payment_schedule?: string;

  @ApiProperty()
  sending_date_to_patient?: string;

  @ApiProperty()
  sent_to_patient?: string;

  @ApiProperty()
  updated_at?: string;
}

export class FindAllPlanRes {
  @ApiProperty()
  data?: FindAllPlanItemRes[];

  @ApiProperty()
  draw?: string;

  @ApiProperty()
  recordsFiltered?: number;

  @ApiProperty()
  recordsTotal?: number;
}
