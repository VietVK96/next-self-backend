import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { EnumMedicalHeaderFormatType } from 'src/entities/medical-header.entity';

@ApiExtraModels()
export class OrdonnancesDto {
  @ApiProperty({
    name: 'user_id',
    required: false,
  })
  user_id?: number;

  @ApiProperty({
    name: 'patient_id',
    required: false,
  })
  patient_id?: number;

  @ApiProperty({
    name: 'keep_params',
    required: false,
  })
  keep_params?: number;

  @ApiProperty({
    name: 'bcbVersion',
    required: false,
  })
  bcbVersion?: string;

  @ApiProperty({
    name: 'title',
    required: false,
  })
  title?: string;

  @ApiProperty({
    name: 'creation_date',
    required: false,
  })
  creation_date?: string;

  @ApiProperty({
    name: 'end_date',
    required: false,
  })
  end_date?: string;

  @ApiProperty({
    name: 'format',
    required: false,
  })
  format?: EnumMedicalHeaderFormatType;

  @ApiProperty({
    name: 'ident_prat',
    required: false,
  })
  ident_prat?: string;

  @ApiProperty({
    name: 'ident_contact',
    required: false,
  })
  ident_contact?: string;

  @ApiProperty({
    name: 'address',
    required: false,
  })
  address?: string;

  @ApiProperty({
    name: 'numberOfPrescription',
    required: false,
  })
  numberOfPrescription?: string;

  @ApiProperty({
    name: 'prescriptions',
    required: false,
  })
  prescriptions?: string;

  @ApiProperty({
    name: 'comment',
    required: false,
  })
  comment?: string;

  @ApiProperty({
    name: 'header_msg',
    required: false,
  })
  header_msg?: string;

  @ApiProperty({
    name: 'header_height',
    required: false,
  })
  header_height?: number;

  @ApiProperty({
    name: 'header_enable',
    required: false,
  })
  header_enable?: number;

  @ApiProperty({
    name: 'signaturePraticien',
    required: false,
  })
  signaturePraticien?: string;
}
