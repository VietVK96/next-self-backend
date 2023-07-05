import { ApiProperty } from '@nestjs/swagger';
import {
  IBeneficiary,
  ICareSheet,
  ICorrespondent,
  IDebtor,
  IPractitioner,
} from '../dto/contact.payment.dto';

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

export class ContactPaymentUpdateRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  date?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  payment_date?: string;

  @ApiProperty()
  payment?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  amount_care?: number;

  @ApiProperty()
  amount_prosthesis?: number;

  @ApiProperty()
  check_number?: string | null;

  @ApiProperty()
  check_bank?: string | null;

  @ApiProperty()
  practitioner?: IPractitioner;

  @ApiProperty()
  correspondent?: ICorrespondent;

  @ApiProperty()
  bank?: {
    id?: number;
  };

  @ApiProperty()
  debtor?: IDebtor;

  @ApiProperty()
  beneficiaries?: IBeneficiary[];

  @ApiProperty()
  caresheet?: ICareSheet;
}
