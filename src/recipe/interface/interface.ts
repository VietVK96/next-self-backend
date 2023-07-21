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
