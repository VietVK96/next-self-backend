import { ApiProperty } from '@nestjs/swagger';

export class FindAccountRes {
  @ApiProperty()
  user?: UserRes;

  @ApiProperty()
  userConnection?: UserConnectionRes;
}

class UserRes {
  id: number;
  admin: number;
  login: string;
  short_name: string;
  lastname: string;
  firstname: string;
  color: number;
  email: string;
  phone_home_number: string;
  phone_mobile_number: string;
  fax_number: string;
  adeli: string;
  finess: string;
  taxes: string;
  social_security_reimbursement_base_rate: number;
  social_security_reimbursement_rate: number;
  aga_member: number;
  freelance: number;
  droit_permanent_depassement: number;
  signature: string;
  token: string;
  bcbdexther_license: string;
  end_of_license_at: string;
  professional: number;
  signature_automatic: number;
  rpps_number: string;
  address: UserAdressRes;
}

class UserAdressRes {
  id: number;
  street: string;
  street_comp: string;
  zip_code: string;
  city: string;
  country: string;
  country_code: string;
}

class UserConnectionRes {
  ip: string;
  session_id: string;
  agent: string;
  created_at: string;
}
