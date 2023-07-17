import { ApiProperty } from '@nestjs/swagger';
export class GetExtrasRes {
  @ApiProperty()
  total?: number;

  @ApiProperty()
  amount?: number;
}

export class FindPaymentRes {
  id: number;
  patient_id: number;
  bank_id: number;
  slip_check_id: number;
  date: string;
  paymentDate: string;
  payment: string;
  type: string;
  amount: number;
  amount_care: number;
  amount_prosthesis: number;
  debtor: string;
  beneficiaries: BeneficiariesRes[];
  patient: PatientRes;
  bank?: BankRes;
  slipCheck?: SlipCheckRes;
}

export class BeneficiariesRes {
  id: number;
  lastname: string;
  firstname: string;
  amount: number;
  amount_care: number;
  amount_prosthesis: number;
}

export class PatientRes {
  id: number;
  number: number;
  lastname: string;
  firstname: string;
}

export class SlipCheckRes {
  id: number;
  number: number;
  date: string;
  label: string;
  amount: number;
  bank_name: string;
}

export class BankRes {
  id: number;
  accounting_code: string;
  third_party_account: string;
  product_account: string;
}

// export class CashingPrintTotalRes {
//   [key: string]: {
//     amount: number;
//     amountCare: number;
//     amountProsthesis: number;
//   };
//   total?: number;
//   byday?: {

//   }
// }
