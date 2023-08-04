import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
@ApiExtraModels()
export class QuotationInitChampsDto {
  @ApiProperty({
    name: 'id_user',
    required: false,
  })
  id_user?: number;
}
