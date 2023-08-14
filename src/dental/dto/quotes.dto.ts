import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

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
