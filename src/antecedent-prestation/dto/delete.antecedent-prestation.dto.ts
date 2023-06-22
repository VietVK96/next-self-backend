import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class DeleteStructDto {
  @ApiProperty({
    required: false,
  })
  id?: number;
}
