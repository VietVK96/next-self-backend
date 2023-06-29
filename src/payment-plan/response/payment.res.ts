import { ApiProperty } from '@nestjs/swagger';

export class PaymentItemRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  doctor_id?: number;

  @ApiProperty()
  patient_id?: number;

  @ApiProperty()
  label?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  observation?: string;

  @ApiProperty()
  lines?: {
    id?: number;
    date?: string;
    amount?: number;
  };
}
