import { ApiProperty } from '@nestjs/swagger';

export class CaresheetsDto {
  @ApiProperty({
    required: true,
  })
  patient_id?: number;

  @ApiProperty({
    required: true,
  })
  user_id?: number;

  @ApiProperty({
    required: false,
  })
  act_id?: string[];

  @ApiProperty({
    required: false,
    default: false,
  })
  is_tp_amo?: boolean;
}
