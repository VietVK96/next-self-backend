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
  practitioner?: {
    id?: number;
    lastname?: number;
    firstname?: string;
  };

  @ApiProperty({
    name: 'debtor',
    required: false,
  })
  debtor?: {
    id?: number;
    name?: string;
  };

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
  beneficiaries?: IBeneficiaries[];

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

export class IBeneficiaries {
  amount?: number;
  amount_care?: number;
  amount_prosthesis?: number;
  pivot?: {
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

interface ICorrespondent {
  id?: number;
}

interface ICareSheet {
  id?: number;
}
