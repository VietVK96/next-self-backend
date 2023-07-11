import { ApiProperty } from '@nestjs/swagger';

export class LookUpRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  msg?: string;

  @ApiProperty()
  createdAt?: string;

  @ApiProperty()
  updatedAt?: string;

  @ApiProperty()
  correspondent_type?: {
    id?: number;
    name?: string;
  } | null;
}

export class CorrespondentRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  civility?: {
    id?: number;
    name?: string;
    long_name?: string;
    sex?: string;
  };

  @ApiProperty()
  type?: {
    id?: number;
    name?: string;
  } | null;

  @ApiProperty()
  address?: {
    id?: number;
    street?: string;
    street_comp?: string;
    zip_code?: string;
    city?: string;
    country?: string;
    country_code?: string;
  } | null;

  @ApiProperty()
  phones?: PhoneStructRes[];
}

export class PhoneStructRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  number?: string;

  @ApiProperty()
  type?: {
    id?: number;
    name?: string;
  };

  @ApiProperty()
  nbr?: string;

  @ApiProperty()
  phoneTypeId?: number;
}
