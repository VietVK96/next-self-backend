import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class ContactPaymentFindAllDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;
}

@ApiExtraModels()
export class ContactPaymentDeleteByIdDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;
}
