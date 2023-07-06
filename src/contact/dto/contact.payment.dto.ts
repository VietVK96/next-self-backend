import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class ContactPaymentFindAllDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;
}

@ApiExtraModels()
export class ContactPaymentDeleteByIdDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;
}
@ApiExtraModels()
export class ContactPaymentStoreDto {
  @ApiProperty({
    name: 'date',
    required: false,
  })
  date?: string;

  @ApiProperty({
    name: 'payment_date',
    required: false,
  })
  payment_date?: string;

  @ApiProperty({
    name: 'payment',
    required: false,
  })
  payment?: string;

  @ApiProperty({
    name: 'type',
    required: false,
  })
  type?: string;

  @ApiProperty({
    name: 'check_number',
    required: false,
  })
  check_number?: string;

  @ApiProperty({
    name: 'amount',
    required: false,
  })
  amount?: number;

  @ApiProperty({
    name: 'amount_care',
    required: false,
  })
  amount_care?: number;

  @ApiProperty({
    name: 'amount_prosthesis',
    required: false,
  })
  amount_prosthesis?: number;

  @ApiProperty({
    name: 'practitioner',
    required: true,
  })
  practitioner?: IPractitioner;

  @ApiProperty({
    name: 'debtor',
    required: false,
  })
  debtor?: IDebtor;

  @ApiProperty({
    name: 'bank',
    required: false,
  })
  bank?: {
    id?: string;
  };

  @ApiProperty({
    name: 'check_bank',
    required: false,
  })
  check_bank?: {
    id?: string;
  };

  @ApiProperty({
    name: 'description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    name: 'beneficiaries',
    required: false,
  })
  beneficiaries?: IBeneficiary[];

  @ApiProperty({
    name: 'correspondent',
    required: false,
  })
  correspondent?: ICorrespondent;

  @ApiProperty({
    name: 'caresheet',
    required: false,
  })
  caresheet?: ICareSheet;

  @ApiProperty({
    name: 'deadlines',
    required: false,
  })
  deadlines?: IDeadline[];
}

export class ContactPaymentUpdateDto {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  date?: string;

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
  paymentDate?: string;

  @ApiProperty()
  is_tp?: number;

  @ApiProperty()
  msg?: string | null;

  @ApiProperty()
  debtor?: IDebtor;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerAbbr?: string;

  @ApiProperty()
  practitionerLastname?: string;

  @ApiProperty()
  practitionerFirstname?: string;

  @ApiProperty()
  bordereau?: string | null;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  check_number?: string | null;

  @ApiProperty()
  check_bank?: string | null;

  @ApiProperty()
  practitioner?: {
    id?: 2;
    lastname?: 'DENTISTE RPPS-ADELI';
    firstname?: 'Géraldine';
  };

  @ApiProperty()
  correspondent?: ICorrespondent;

  @ApiProperty()
  bank?: {
    id?: number;
  };

  @ApiProperty()
  caresheet?: {
    id?: number;
  };

  @ApiProperty()
  beneficiaries?: IBeneficiary[];

  @ApiProperty()
  deadlines?: IDeadline[];
}

export interface IBeneficiary {
  amount?: number;
  amount_care?: number;
  amount_prosthesis?: number;
  pivot?: {
    id?: number;
    amount?: number;
    amount_care?: number;
    amount_prosthesis?: number;
  };
  id?: number;
  full_name?: string;
}

export interface IDeadline {
  date?: string;
  amount?: number;
  amount_care?: number;
  amount_prosthesis?: number;
}

export interface ICorrespondent {
  id?: number | null;
  lastname?: string | null;
  firstname?: string | null;
}

export interface ICareSheet {
  id?: number;
}

export interface IDebtor {
  id?: number;
  name?: string;
}

export interface IPractitioner {
  id?: number;
  lastname?: number;
  firstname?: string;
}
