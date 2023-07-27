import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

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
