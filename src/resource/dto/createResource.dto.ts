import { ApiProperty } from '@nestjs/swagger';

export class CreateResourceSubcriber {
  @ApiProperty()
  id?: number;
}

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
  useDefaultColor?: number;

  @ApiProperty({
    default: 0,
  })
  free?: number;

  @ApiProperty()
  addressee?: number;

  @ApiProperty()
  listAssistante?: CreateResourceSubcriber[];
}