import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class CheckPriceStructDto {
  @ApiProperty({
    required: false,
  })
  id?: number;

  @ApiProperty({
    required: false,
  })
  amount?: number;
}
