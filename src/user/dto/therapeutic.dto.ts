import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class UpdateTherapeuticDto {
  @ApiProperty({
    name: 'therapeutic_alternative',
    required: false,
  })
  therapeutic_alternative?: string[];
}
