import { ApiProperty } from '@nestjs/swagger';

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

export class UserThirdPartyRes {
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
