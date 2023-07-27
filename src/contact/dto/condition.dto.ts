// condition.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { FindAllStructDto } from './findAll.contact.dto';

export class ConditionsDto {
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
  conditions?: FindAllStructDto[];
}
