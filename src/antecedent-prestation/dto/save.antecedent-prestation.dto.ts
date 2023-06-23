import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class SaveStructDto {
  @ApiProperty({
    required: false,
  })
  id?: number;

  @ApiProperty({
    required: false,
  })
  name?: string;

  @ApiProperty({
    required: false,
  })
  teeth?: string;

  @ApiProperty({
    required: false,
  })
  contactId?: number;

  @ApiProperty({
    required: false,
  })
  libraryActId?: number;

  @ApiProperty({
    required: false,
  })
  libraryActQuantityId?: number;
}
