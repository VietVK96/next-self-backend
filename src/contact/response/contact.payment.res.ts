import { ApiProperty } from '@nestjs/swagger';

export class ContactPaymentFindAllRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  amount?: string;

  @ApiProperty()
  amount_care?: string;

  @ApiProperty()
  amount_prosthesis?: string;

  @ApiProperty()
  bordereau?: string;

  @ApiProperty()
  debtor?: number;

  @ApiProperty()
  is_tp?: number;

  @ApiProperty()
  msg?: string;

  @ApiProperty()
  payment?: string;

  @ApiProperty()
  paymentDate?: string;

  @ApiProperty()
  practitionerAbbr?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  type?: string;
}
