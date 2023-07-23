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
