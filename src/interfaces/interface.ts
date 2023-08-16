import { ContactUserEntity } from 'src/entities/contact-user.entity';

interface PaymentInterface {
  id: number;
  patient_id: number;
  bank_id: number;
  slip_check_id: number;
  date: Date;
  paymentDate: Date;
  payment: string;
  type: string;
  amount: string;
  amountCare: string;
  amountProsthesis: string;
  debtor: string;
  checkNbr?: string;
  checkBank?: string;
  msg: string;
  patient: PatientStatement[];
  beneficiaries: Beneficiaries[];
  bank: BankStatement[];
  slip_check: SlipCheck[];
}

interface Beneficiaries {
  id: number;
  lastname: string;
  firstname: string;
  amount: number;
  amount_care: string;
  amount_prosthesis: string;
}

interface BankStatement {
  id: number;
  accounting_code: string;
  third_party_account: string;
  product_account: string;
  bank_name: string;
}

interface SlipCheck {
  id: number;
  number: number;
  date: Date;
  label: string;
  amount: string;
  bank_name: string;
}

interface PatientStatement {
  id: number;
  number: number;
  lastname: string;
  firstname: string;
}

interface Condition {
  name: string;
  op: string;
  value: string;
  field: string;
  label: string;
}

interface Extras {
  total: number;
  amount: number;
}

interface Options {
  limit: number;
  offset: number;
  order_by: string;
  order: string;
}

interface ItemResponse {
  id: string;
  cell: {
    checkbox: number;
    entryDate: string;
    date: string;
    label: {
      debtor: string;
      beneficiaries: { fullName: string; amount: string }[];
    };
    slipCheckName: string;
    mode: string;
    type: string;
    amount: string;
    amountCare: string;
    amountProsthesis: string;
    i1: string;
    i2: string;
  };
  className: string;
}

interface IPatientBalances {
  current_page_number?: number;

  custom_parameters?: {
    query: {
      id: number;
      page: number;
      per_page: number;
      direction: string;
      sort: string;
    };
  };

  items?: ContactUserEntity[];

  num_item_per_page?: number;

  paginator_options?: PaginatorOptions;

  range?: number;

  total_count?: number;
}

interface PaginatorOptions {
  defaultSortDirection?: string;

  defaultSortFieldName?: string;

  distinct?: boolean;

  filterFieldParameterName?: string;

  filterValueParameterName?: string;

  pageParameterName?: string;

  sortDirectionParameterName?: string;

  sortFieldParameterName?: string;
}

export {
  PaymentInterface,
  PatientStatement,
  Beneficiaries,
  SlipCheck,
  BankStatement,
  Condition,
  Extras,
  Options,
  ItemResponse,
  IPatientBalances,
};
