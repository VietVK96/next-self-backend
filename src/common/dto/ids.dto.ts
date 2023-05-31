import { ApiProperty } from '@nestjs/swagger';

export class IdsDto {
  @ApiProperty()
  ids: number[];
}

export class IdsPasswordDto {
  @ApiProperty()
  ids: number[];

  @ApiProperty({
    required: false,
  })
  password?: string;
}

export class IdsStringDto {
  @ApiProperty()
  ids: string[];
}
