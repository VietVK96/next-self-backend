import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class FindPrestationStructDto {
  @ApiProperty({
    required: false,
  })
  id?: number;
}
