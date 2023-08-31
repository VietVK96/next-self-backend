import { ApiProperty } from '@nestjs/swagger';
import { ConditionDto } from './condition.dto';

export class QueryParamsDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 50 })
  rp: number;

  @ApiProperty({ example: 'paymentDate|date' })
  sortname: string;

  @ApiProperty({ example: 'asc|desc' })
  sortorder: string;

  @ApiProperty({ example: 'all' })
  action: string;

  @ApiProperty({
    isArray: true,
    example: [
      {
        name: 'Date de paiement',
        op: 'gte',
        field: 'csg.paymentDate',
        value: '2023-07-01',
        label: 'est supérieur(e) à',
      },
      {
        name: 'Date de paiement',
        op: 'lte',
        field: 'csg.date',
        value: '2023-07-31',
        label: 'est inférieur(e)',
      },
    ],
  })
  conditions: ConditionDto[];

  @ApiProperty({ required: true })
  user: number;
}
