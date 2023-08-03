import { ApiProperty } from '@nestjs/swagger';
export class StatisticsPaymentDto {
  @ApiProperty()
  doctor_id?: number;

  @ApiProperty()
  start_date?: string;

  @ApiProperty()
  end_date?: string;

  @ApiProperty()
  aggregate?: string;
}
