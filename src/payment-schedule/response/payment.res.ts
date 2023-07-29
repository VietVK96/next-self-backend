import { ApiProperty } from '@nestjs/swagger';
import { Line } from '../dto/payment.dto';

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
  lines?: Line[];
}
