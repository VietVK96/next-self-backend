import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { EnumMedicalHeaderFormatType } from 'src/entities/medical-header.entity';

@ApiExtraModels()
export class OrdonnancesDto {
  @ApiProperty({
    name: 'user_id',
    required: false,
  })
  userId?: number;

  @ApiProperty({
    name: 'patient_id',
    required: false,
  })
  patientId?: number;

  @ApiProperty({
    name: 'keep_params',
    required: false,
  })
  keepParams?: number;

  @ApiProperty({
    name: 'bcbVersion',
    required: false,
  })
  bcbVersion?: number;

  @ApiProperty({
    name: 'title',
    required: false,
  })
  title?: string;

  @ApiProperty({
    name: 'creation_date',
    required: false,
  })
  creationDate?: string;

  @ApiProperty({
    name: 'end_date',
    required: false,
  })
  endDate?: string;

  @ApiProperty({
    name: 'format',
    required: false,
  })
  format?: EnumMedicalHeaderFormatType;

  @ApiProperty({
    name: 'ident_prat',
    required: false,
  })
  identPrat?: string;

  @ApiProperty({
    name: 'ident_contact',
    required: false,
  })
  identContact?: string;

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
  headerMsg?: string;

  @ApiProperty({
    name: 'header_height',
    required: false,
  })
  headerHeight?: number;

  @ApiProperty({
    name: 'header_enable',
    required: false,
  })
  headerEnable?: number;

  @ApiProperty({
    name: 'signaturePraticien',
    required: false,
  })
  signaturePraticien?: string;
}
