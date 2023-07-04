import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class Traceabilities {
  @ApiProperty({
    name: 'id',
    required: false,
  })
  id?: number;

  @ApiProperty({
    name: 'medical_device_id',
    required: false,
  })
  medicalDeviceId?: number;

  @ApiProperty({
    name: 'observation',
    required: false,
  })
  observation?: string;

  @ApiProperty({
    name: 'reference',
    required: false,
  })
  reference?: string;
}

export class UpdateTraceabilitiesDto {
  @ApiProperty({
    name: 'traceabilities',
    required: false,
  })
  traceabilities?: Traceabilities[];
}
