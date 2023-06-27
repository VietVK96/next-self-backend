import { ApiProperty } from '@nestjs/swagger';

export class UserResourceRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  color?: {
    background?: string;
    foreground?: string;
  };

  @ApiProperty()
  doctorId?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerName?: string;

  @ApiProperty()
  use_default_color?: boolean;
}

export class UserPractitionersRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  admin?: number;

  @ApiProperty()
  abbr?: string;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  phoneHome?: string;

  @ApiProperty()
  phoneMobile?: string;

  @ApiProperty()
  phoneFax?: string;

  @ApiProperty()
  agaMember?: number;

  @ApiProperty()
  droit_permanent_depassement?: number;

  @ApiProperty()
  numeroFacturant?: number;

  @ApiProperty()
  finess?: string;

  @ApiProperty()
  fluxCps?: string;

  @ApiProperty()
  rateCharges?: number;

  @ApiProperty()
  social_security_reimbursement_base_rate?: number;

  @ApiProperty()
  social_security_reimbursement_rate?: number;

  @ApiProperty()
  bcbLicense?: string;

  @ApiProperty()
  signature?: string;

  @ApiProperty()
  token?: string;

  @ApiProperty()
  permissionBilling?: number;

  @ApiProperty()
  permissionPaiement?: number;

  @ApiProperty()
  permissionAccounting?: number;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  resourceId?: number;

  @ApiProperty()
  resourceName?: string;

  @ApiProperty()
  groupId?: number;
}

export class SessionRes {
  @ApiProperty()
  resources?: UserResourceRes[];

  @ApiProperty()
  practitioners?: UserPractitionersRes[];
}
