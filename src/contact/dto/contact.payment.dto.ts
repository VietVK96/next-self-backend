import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { parseJson } from 'src/common/util/json';

@ApiExtraModels()
export class ContactPaymentFindAllDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;
}
