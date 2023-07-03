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

export class EventTaskPatchDto {
  @ApiProperty({
    name: 'name',
    required: false,
  })
  name?: string;

  @ApiProperty({
    name: 'pk',
    required: false,
  })
  pk?: number;

  @ApiProperty({
    name: 'user',
    required: false,
  })
  user?: number;

  @ApiProperty({
    name: 'value',
    required: false,
  })
  value?: string | boolean | { ngap_key_id: number; coef: number };
}
