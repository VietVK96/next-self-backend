import { ApiProperty } from '@nestjs/swagger';

export class FindAllContactPhoneRes {
  nbr?: string;
}

export class FindAllContactRes {
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
  phones?: FindAllContactPhoneRes[];

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
