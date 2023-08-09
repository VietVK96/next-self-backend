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

export class CaresheetRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  usrId?: number;

  @ApiProperty()
  conId?: number;

  @ApiProperty()
  fseStatusId?: number;

  @ApiProperty()
  dreStatusId?: number;

  @ApiProperty()
  amoId?: number;

  @ApiProperty()
  amcId?: number;

  @ApiProperty()
  numeroFacturation?: string;

  @ApiProperty()
  nbr?: string;

  @ApiProperty()
  date?: string;

  @ApiProperty()
  mode?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  electronicCaresheet?: boolean;

  @ApiProperty()
  tiersPayant?: boolean;

  @ApiProperty()
  tiersPayantStatus?: boolean;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  thirdPartyAmount?: number;

  @ApiProperty()
  thirdPartyAmountPaid?: number;

  @ApiProperty()
  amountAMO?: number;

  @ApiProperty()
  amountAMC?: number;

  @ApiProperty()
  amountAssure?: number;

  @ApiProperty()
  externalReferenceId?: number;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}
