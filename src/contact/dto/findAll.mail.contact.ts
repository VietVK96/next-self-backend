import { ApiProperty } from '@nestjs/swagger';

export class FindAllMailDto {
  @ApiProperty()
  id?: number | string;

  @ApiProperty()
  order_by?: string;

  @ApiProperty()
  start?: string | number;

  @ApiProperty()
  length?: string | number;

  @ApiProperty()
  draw: number | string;
}
