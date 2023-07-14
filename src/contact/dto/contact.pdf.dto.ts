import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class ContactPdfDto {
  @ApiProperty({
    name: 'id',
    required: false,
  })
  id?: number;

  @ApiProperty({
    name: 'observation_filter',
    required: false,
  })
  observation_filter?: string;

  @ApiProperty({
    name: 'patient_history_filter',
    isArray: true,
    type: String,
    required: false,
  })
  patient_history_filter?: string[];
}
