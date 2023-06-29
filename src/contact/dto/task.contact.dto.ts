import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class EventTaskDto {
  @ApiProperty({
    name: 'id',
    required: false,
  })
  id?: number;

  @ApiProperty({
    name: 'user',
    required: false,
  })
  user?: number;
}
