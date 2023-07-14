import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class PatientBalanceUpdateQueryDto {
  @ApiProperty({
    name: 'patient_id',
    required: true,
  })
  patient_id?: number;
}

export class PatientBalanceUpdatePayloadDto {
  @ApiProperty({
    name: 'balance',
    required: true,
  })
  balance?: number;

  @ApiProperty({
    name: 'doctorId',
    required: true,
  })
  doctorId?: number;
}

export class OdontogramCurrentDto {
  @ApiProperty({
    required: true,
  })
  patientId: number;
}
