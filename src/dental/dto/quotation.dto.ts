import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
@ApiExtraModels()
export class QuotationInitChampsDto {
  @ApiProperty({
    name: 'id_user',
    required: false,
  })
  id_user?: number;

  @ApiProperty({
    name: 'id_pdt',
    required: false,
  })
  id_pdt?: number;

  @ApiProperty({
    name: 'id_devis',
    required: false,
  })
  id_devis?: number;

  @ApiProperty({
    name: 'pdf',
    required: false,
  })
  pdf?: boolean;
}
