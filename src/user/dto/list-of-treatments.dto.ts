import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

import { IsSqlOperator } from './validator-custom';

@ApiExtraModels()
export class FindAllConditionsDto {
  @ApiProperty({
    name: '[field]',
    required: false,
  })
  field?: string;

  @ApiProperty({
    name: '[op]',
    required: false,
  })
  op?: string;

  @ApiProperty({
    name: '[value]',
    required: false,
  })
  value?: string;
}

export class ListOfTreatmentsFindAllDto {
  @ApiProperty({ example: 1 })
  page?: number;

  @ApiProperty({ example: 100 })
  rp?: number;

  @ApiProperty({
    isArray: true,
    example: '{"field": "con.lastname", "op": "like", "value": "sd"}',
    type: FindAllConditionsDto,
    required: false,
  })
  @IsSqlOperator()
  conditions?: FindAllConditionsDto[];
}
