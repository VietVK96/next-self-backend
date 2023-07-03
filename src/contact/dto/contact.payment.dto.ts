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

export class ContactPaymentStoreDto {
  date: string;
  payment_date: string;
  payment: string;
  type: string;
  amount: number;
  amount_care: number;
  amount_prosthesis: number;
  practitioner: {
    id: number;
    lastname: number;
    firstname: string;
  };
  debtor: {
    name: string;
  };
  bank: {
    id: string;
  };
  description: string;
  beneficiaries: Beneficiaries[];
  deadlines: Deadline[];
}

interface Beneficiaries {
  amount_due: number;
  amount_due_care: number;
  amount_due_prosthesis: number;
  pivot: {
    amount: number;
    amount_care: number;
    amount_prosthesis: number;
  };
  id: number;
  full_name: string;
}

interface Deadline {
  date: string;
  amount: number;
  amount_care: number;
  amount_prosthesis: number;
}
