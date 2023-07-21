// condition.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ConditionDto {
  @ApiProperty({ example: 'Date de paiement' })
  name: string;

  @ApiProperty({ example: 'gte|lte' })
  op: string;

  @ApiProperty({ example: 'csg.paymentDate|csg.date' })
  field: string;

  @ApiProperty({ example: '2023-01-01' })
  value: string;

  @ApiProperty({ example: 'est supérieur(e) à' })
  label: string;
}
