import { ApiProperty } from '@nestjs/swagger';

export class PatientContactPhoneRes {
  nbr?: string;
}

export class PatientContactRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  DT_RowId?: number;

  @ApiProperty()
  amountDue?: string;

  @ApiProperty()
  birthday?: string;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  insee_number?: number;

  @ApiProperty()
  insee_number_key?: string;

  @ApiProperty()
  label?: string;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  msg?: string;

  @ApiProperty()
  nbr?: number;

  @ApiProperty()
  phones?: PatientContactPhoneRes[];

  @ApiProperty()
  practitionerAbbr?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  reliability?: number;

  @ApiProperty()
  value?: number;
}

export class ThirdPartyPatientRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  full_name?: string;
}

export class AmcRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  libelle?: string;

  @ApiProperty()
  numero?: string;
}

export class ThirdPartyAmcRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  status?: string;

  @ApiProperty()
  amc?: AmcRes;
}

export class AmoRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  libelle?: string;

  @ApiProperty()
  code_national?: string;
}

export class ThirdPartyAmoRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  status?: string;

  @ApiProperty()
  amo?: AmoRes;
}

export class PatientThirdPartyRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  number?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  creation_date?: string;

  @ApiProperty()
  third_party_amount?: number;

  @ApiProperty()
  third_party_amount_paid?: number;

  @ApiProperty()
  tiers_payant_status?: string;

  @ApiProperty()
  patient?: ThirdPartyPatientRes;

  @ApiProperty()
  third_party_amc?: ThirdPartyAmcRes;

  @ApiProperty()
  third_party_amo?: ThirdPartyAmoRes;
}
