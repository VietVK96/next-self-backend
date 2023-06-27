import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class ContactPaymentFindAllDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;
}
