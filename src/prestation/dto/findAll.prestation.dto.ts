import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class FindAllPrestationStructDto {
  @ApiProperty({
    required: false,
  })
  id?: number;
}
