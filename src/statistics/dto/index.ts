import { ApiProperty } from '@nestjs/swagger';

export class FilterValuesStatisticDto {
  @ApiProperty()
  start_date?: Date;

  @ApiProperty()
  end_date?: Date;

  @ApiProperty()
  aggregate?: string;

  @ApiProperty()
  doctor_id: number;
}
