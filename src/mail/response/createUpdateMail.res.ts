import { ApiProperty } from '@nestjs/swagger';

export class CreateUpdateMailRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  body?: string;

  @ApiProperty()
  footer_content?: string;

  @ApiProperty()
  footer_height?: number;

  @ApiProperty()
  height?: number;

  @ApiProperty()
  favorite?: number;

  @ApiProperty()
  created_at?: Date;

  @ApiProperty()
  updated_at?: Date;

  @ApiProperty()
  doctor?: number;

  @ApiProperty()
  header?: number;

  @ApiProperty()
  footer?: number;
}