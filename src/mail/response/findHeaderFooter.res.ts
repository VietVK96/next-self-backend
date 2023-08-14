import { ApiProperty } from '@nestjs/swagger';

export class FindHeaderFooterRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  body?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  height?: number;

  @ApiProperty()
  favorite?: number;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}
