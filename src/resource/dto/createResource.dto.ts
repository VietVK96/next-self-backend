import { ApiProperty } from '@nestjs/swagger';

export class CreateResourceDto {
  @ApiProperty({
    required: true,
  })
  name?: string;

  @ApiProperty()
  archivedAt?: string;

  @ApiProperty()
  color?: string;

  @ApiProperty({
    default: 0,
  })
  userDefaultColor?: number;

  @ApiProperty({
    default: 0,
  })
  free?: number;

  @ApiProperty()
  addressee?: number;

  @ApiProperty()
  listAssistante?: [{ id?: number }];
}
