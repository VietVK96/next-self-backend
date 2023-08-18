import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class BankCheckPrintDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;
  @ApiProperty({
    name: 'doctor_id',
    required: true,
  })
  doctor_id?: number;

  @ApiProperty({
    name: 'amount',
    required: true,
  })
  amount?: number;
}
export class BankCheckFieldPositionDto {
  @ApiProperty()
  top?: number;

  @ApiProperty()
  left?: number;
}
export class BankCheckFieldItemDto {
  @ApiProperty()
  position?: BankCheckFieldPositionDto;
}
export class BankCheckFieldSumWordDto {
  @ApiProperty()
  position?: BankCheckFieldPositionDto;

  @ApiProperty()
  width?: number;
}
export class BankCheckFieldDto {
  @ApiProperty()
  sum_words_line_1?: BankCheckFieldSumWordDto;

  @ApiProperty()
  sum_digit?: BankCheckFieldItemDto;

  @ApiProperty()
  sum_words_line_2?: BankCheckFieldItemDto;

  @ApiProperty()
  place?: BankCheckFieldItemDto;

  @ApiProperty()
  payee?: BankCheckFieldItemDto;

  @ApiProperty()
  date?: BankCheckFieldItemDto;
}

export class UpdateBankCheckDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  fields?: BankCheckFieldDto;
}

export class CreateUpdateBankStreet {
  @ApiProperty()
  street?: string;

  @ApiProperty()
  zipCode?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  countryAbbr?: string;
}
export class CreateUpdateBankDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  bankOfGroup?: number;

  @ApiProperty()
  usrId?: number;

  @ApiProperty()
  abbr?: string;

  @ApiProperty({
    nullable: false,
  })
  name?: string;

  @ApiProperty()
  bankCode?: string;

  @ApiProperty()
  branchCode?: string;

  @ApiProperty()
  accountNbr?: string;

  @ApiProperty()
  bankDetails?: string;

  @ApiProperty()
  slipCheckNbr?: number;

  @ApiProperty()
  currency?: string;

  @ApiProperty()
  accountingCode?: string;

  @ApiProperty()
  third_party_account?: string;

  @ApiProperty()
  product_account?: string;

  @ApiProperty()
  transfertDefault?: number;

  @ApiProperty()
  address?: CreateUpdateBankStreet;
}
export class SortableUpdateBankCheckDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  position?: number;

  @ApiProperty()
  id?: number;
}
