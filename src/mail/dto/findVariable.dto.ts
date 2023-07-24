import { ApiProperty } from '@nestjs/swagger';

export class FindVariableDto {
  @ApiProperty()
  patient_id?: number;

  @ApiProperty()
  correspondent_id?: number;

  @ApiProperty()
  payment_schedule_id?: number;
}

export class ContextMailDto extends FindVariableDto {}
