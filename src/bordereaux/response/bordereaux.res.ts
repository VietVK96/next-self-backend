import { ApiProperty } from '@nestjs/swagger';

export class BordereauxTotalAmountRes {
  @ApiProperty()
  totalAmount?: string;
}

export class BordereauxRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  bankId?: number;

  @ApiProperty()
  bankName?: string;

  @ApiProperty()
  date?: string;

  @ApiProperty()
  label?: string;

  @ApiProperty()
  nbr?: number;

  @ApiProperty()
  paymentChoice?: string;

  @ApiProperty()
  paymentCount?: number;
}

export class BordereauxIndexItemRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  creation_date?: string;

  @ApiProperty()
  label?: string;

  @ApiProperty()
  number?: number;

  @ApiProperty()
  bankId?: number;

  @ApiProperty()
  bankName?: string;

  @ApiProperty()
  payment_choice?: string;

  @ApiProperty()
  payment_choice_readable?: string;

  @ApiProperty()
  payment_count?: number;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  bank?: BordereauxIndexItemBankRes;
}

export class BordereauxIndexItemBankRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  name?: string;
}

export class BordereauxIndexParameterRes {
  @ApiProperty()
  sorted?: boolean;
}

export class BordereauxIndexExtraRes {
  @ApiProperty()
  total_amount?: number;
}

export class BordereauxIndexPaginatorRes {
  @ApiProperty()
  defaultSortDirection?: string;

  @ApiProperty()
  defaultSortFieldName?: string;

  @ApiProperty()
  distinct?: boolean;

  @ApiProperty()
  filterFieldParameterName?: string;

  @ApiProperty()
  filterValueParameterName?: string;

  @ApiProperty()
  pageParameterName?: string;

  @ApiProperty()
  sortDirectionParameterName?: string;

  @ApiProperty()
  sortFieldParameterName?: string;
}

export class BordereauxIndexRes {
  @ApiProperty()
  current_page_number?: number;

  @ApiProperty()
  custom_parameters?: BordereauxIndexParameterRes;

  @ApiProperty()
  extra?: BordereauxIndexExtraRes;

  @ApiProperty()
  items?: BordereauxIndexItemRes[];

  @ApiProperty()
  num_item_per_page?: number;

  @ApiProperty()
  paginator_options?: BordereauxIndexPaginatorRes;

  @ApiProperty()
  range?: number;

  @ApiProperty()
  total_count?: number;
}

export class BordereauxPaymentRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  debtor?: string;

  @ApiProperty()
  payerId?: number;

  @ApiProperty()
  payerFirstName?: string;

  @ApiProperty()
  payerLastName?: string;

  @ApiProperty()
  payment?: string;

  @ApiProperty()
  paymentDate?: string;

  @ApiProperty()
  type?: string;
}

export class BordereauxPaymentIndexItemRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  amount?: number;

  @ApiProperty()
  label?: string;

  @ApiProperty()
  method?: string;

  @ApiProperty()
  method_readable?: string;

  @ApiProperty()
  payment_date?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  type_readable?: string;
}

export class BordereauxPaymentIndexRes {
  @ApiProperty()
  current_page_number?: number;

  @ApiProperty()
  custom_parameters?: BordereauxIndexParameterRes;

  @ApiProperty()
  items?: BordereauxPaymentIndexItemRes[];

  @ApiProperty()
  num_item_per_page?: number;

  @ApiProperty()
  paginator_options?: BordereauxIndexPaginatorRes;

  @ApiProperty()
  range?: number;

  @ApiProperty()
  total_count?: number;
}

export class BordereauxUserBankRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  account_number?: string;

  @ApiProperty()
  agency_code?: string;

  @ApiProperty()
  code?: string;

  @ApiProperty()
  currency?: string;

  @ApiProperty()
  is_default?: boolean;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  position?: number;

  @ApiProperty()
  short_name?: string;
}
