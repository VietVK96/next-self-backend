export interface Condition {
  name: string;
  op: string;
  value: string;
  field: string;
  label: string;
}

export interface Extras {
  total: number;
  amount: number;
}

export interface Options {
  limit: number;
  offset: number;
  order_by: string;
  order: string;
}

export interface ItemResponse {
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

export interface PaymentInterface {
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
  patient: [
    { id: number; number: number; lastname: string; firstname: string },
  ];
  beneficiaries: [
    {
      id: number;
      lastname: string;
      firstname: string;
      amount: number;
      amount_care: string;
      amount_prosthesis: string;
    },
  ];
  bank: [
    {
      id: number;
      accounting_code: string;
      third_party_account: string;
      product_account: string;
      bank_name: string;
    },
  ];
  slip_check: [
    {
      id: number;
      number: number;
      date: Date;
      label: string;
      amount: string;
      bank_name: string;
    },
  ];
}
