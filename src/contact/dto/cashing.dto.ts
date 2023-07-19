import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { FindAllStructDto } from './findAll.contact.dto';
@ApiExtraModels()
export class CashingPrintDto {
  @ApiProperty()
  contact?: number;
  @ApiProperty()
  sortname?: string;
  @ApiProperty()
  group?: string;
  @ApiProperty()
  sortorder?: string;
  @ApiProperty()
  anonymous?: string;
  @ApiProperty()
  conditions?: FindAllStructDto[];
  @ApiProperty()
  user?: number;
}

export class CashingQueryOptions {
  limit?: string;
  offset?: string;
  order_by?: string;
  order?: string;
}

export class PrintCashingTotal {
  [key: string]: {
    total?: number;
    amount?: number;
    amountCare?: number;
    amountProsthesis?: number;
  };
}

export class ByDayRes {
  [key: string]: {
    [key: string]: number;
  };
}
export class PrintCashingTotalText {
  [key: string]: {
    total?: string;
    amount?: string;
    amountCare?: string;
    amountProsthesis?: string;
  };
}

export class ByDayResText {
  [key: string]: {
    [key: string]: string;
  };
}
