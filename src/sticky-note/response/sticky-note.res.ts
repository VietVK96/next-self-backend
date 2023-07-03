import { ApiProperty } from '@nestjs/swagger';

export class StickyNoteRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  msg?: string;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  editable?: number;

  @ApiProperty()
  shareable?: number;

  @ApiProperty()
  shared?: number;

  @ApiProperty()
  createdOn?: string;

  @ApiProperty()
  width?: number;

  @ApiProperty()
  height?: number;

  @ApiProperty()
  left?: number;

  @ApiProperty()
  top?: number;
}
