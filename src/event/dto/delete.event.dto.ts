import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class DeteleEventDto {
  @ApiProperty({
    required: false,
  })
  hasRecurrEvents?: boolean;

  @ApiProperty({
    required: false,
  })
  scp?: string;
}
