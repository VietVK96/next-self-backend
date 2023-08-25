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

@ApiExtraModels()
export class PreferenceQuotationDto {
  @ApiProperty({
    name: 'name',
    required: false,
  })
  name?: string;

  @ApiProperty({
    name: 'value',
    required: false,
    type: String, // Define the type as string
  })
  value?: string | number;
}
