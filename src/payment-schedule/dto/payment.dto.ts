import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
@ApiExtraModels()
export class PaymentSchedulesDto {
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
  observation?: string | null;
  @ApiProperty()
  lines?: LineDto[];
}

export class LineDto {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  date?: string;
  @ApiProperty()
  amount?: string;
}

export class PaymentSchedulesParamDto {
  @ApiProperty()
  id?: number;
}
