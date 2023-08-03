import { ApiProperty } from '@nestjs/swagger';

export class UpdateResourceDto {
  @ApiProperty({
    required: true,
  })
  id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  useDefaultColor?: number;

  @ApiProperty()
  color?: string;

  @ApiProperty()
  listAssistante: SubscribersIdList[];
}

export class SubscribersIdList {
  @ApiProperty()
  id?: number;
}
