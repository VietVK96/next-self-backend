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
    amount: number;
    amountCare: number;
    amountProsthesis: number;
    i1: string;
    i2: string;
  };
  className: string;
}
