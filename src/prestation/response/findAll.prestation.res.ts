import { ApiProperty } from '@nestjs/swagger';

export class FindAllPrestationRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  date?: string;

  @ApiProperty()
  amount?: string;

  @ApiProperty()
  state?: number;

  @ApiProperty()
  msg?: string;

  @ApiProperty()
  traceability_status?: number;

  @ApiProperty()
  nomenclature?: string;

  @ApiProperty()
  teeth?: string;

  @ApiProperty()
  coef?: number;

  @ApiProperty()
  exceeding?: string;

  @ApiProperty()
  ccamCode?: string;

  @ApiProperty()
  ccamTelem?: number;

  @ApiProperty()
  ccamModifier?: string;

  @ApiProperty()
  exemption_code?: string;

  @ApiProperty()
  exceptional_refund?: number;

  @ApiProperty()
  secuAmount?: number;

  @ApiProperty()
  caresheetId?: number;

  @ApiProperty()
  ccam_id?: number;

  @ApiProperty()
  ccam_code?: string;

  @ApiProperty()
  ccam_repayable_on_condition?: number;

  @ApiProperty()
  ngap_key_id?: number;

  @ApiProperty()
  code?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerAbbr?: string;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  cotation?: string;

  @ApiProperty()
  exception?: boolean;
}
