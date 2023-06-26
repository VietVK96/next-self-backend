import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class FindAllStructDto {
  @ApiProperty({
    required: false,
  })
  id?: number;
}
