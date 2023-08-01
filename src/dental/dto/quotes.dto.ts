import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { EnumBillLineType } from 'src/entities/bill-line.entity';

@ApiExtraModels()
export class QuotesConventionDto {
  @ApiProperty({
    name: 'id_user',
    required: false,
  })
  id_user?: number;

  @ApiProperty({
    name: 'no_pdt',
    required: false,
  })
  no_pdt?: number;
}
