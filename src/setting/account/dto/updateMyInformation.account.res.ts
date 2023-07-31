import { ApiProperty } from '@nestjs/swagger';

export class UpdateMyInformationDto {
  @ApiProperty()
  log?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  short_name?: string;

  @ApiProperty()
  phoneNumber?: string;

  @ApiProperty()
  gsm?: string;

  @ApiProperty()
  faxNumber?: string;

  @ApiProperty()
  medical?: {
    rpps_number?: string;
  };

  @ApiProperty()
  finess?: string;

  @ApiProperty()
  company_name?: string;

  @ApiProperty()
  street?: string;

  @ApiProperty()
  zip_code?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  countryAbbr?: string;

  @ApiProperty()
  rateCharges?: string;

  @ApiProperty()
  signature?: string;

  @ApiProperty()
  amo?: {
    code_convention?: number;
  };

  @ApiProperty()
  social_security_reimbursement_base_rate?: number;

  @ApiProperty()
  social_security_reimbursement_rate?: number;

  @ApiProperty()
  freelance?: string;

  @ApiProperty()
  agaMember?: any;

  @ApiProperty()
  droit_permanent_depassement?: any;
}
