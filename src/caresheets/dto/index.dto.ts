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
  act_id?: number[];

  @ApiProperty({
    required: false,
  })
  prescripteur?: string;

  @ApiProperty({
    required: false,
  })
  situation_parcours_de_soin?: string;

  @ApiProperty({
    required: false,
  })
  nom_medecin_orienteur?: string;

  @ApiProperty({
    required: false,
  })
  prenom_medecin_orienteur?: string;

  @ApiProperty({
    required: false,
    default: false,
  })
  is_tp_amo?: boolean;

  @ApiProperty({
    required: false,
    default: false,
  })
  is_tp_amc?: boolean;

  @ApiProperty({
    required: false,
    default: false,
  })
  related_ald?: boolean;

  @ApiProperty({
    required: false,
  })
  date_prescription?: string;

  @ApiProperty({
    required: false,
  })
  date_demande_prealable?: string;

  @ApiProperty({
    required: false,
  })
  code_accord_prealable?: string;

  @ApiProperty({
    required: false,
  })
  suite_exp?: string;
}
