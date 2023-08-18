import { ApiProperty } from '@nestjs/swagger';

interface IOperatorItem {
  name?: string;

  label?: string;

  value?: string;
}

export class AdvancedSearchRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  field?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  op?: Array<IOperatorItem>;

  @ApiProperty()
  values?: string[];
}
