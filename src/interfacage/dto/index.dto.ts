import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class FsDto {
  @ApiProperty({
    required: false,
  })
  patient_id?: number;

  @ApiProperty({
    required: false,
  })
  user_id?: number;

  @ApiProperty({
    required: false,
  })
  act_id?: [number];
}
