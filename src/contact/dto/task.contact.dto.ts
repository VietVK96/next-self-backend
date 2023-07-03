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

@ApiExtraModels()
export class EventTaskPatchDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  value?: string | ValueType;

  @ApiProperty()
  pk?: number;

  @ApiProperty()
  user?: number;
}

interface ValueType {
  ngap_key_id: number;
  coef: any;
}
