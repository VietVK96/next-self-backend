import { ApiProperty } from '@nestjs/swagger';

export class SaveStickNoteDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  color?: number;

  @ApiProperty({
    required: false,
  })
  createdOn?: number;

  @ApiProperty()
  editable?: number;

  @ApiProperty()
  shareable?: number;

  @ApiProperty()
  shared?: number;

  @ApiProperty()
  height?: number;

  @ApiProperty()
  width?: number;

  @ApiProperty()
  top?: number;

  @ApiProperty()
  left?: number;

  @ApiProperty({
    required: true,
  })
  msg?: string;

  @ApiProperty({
    required: false,
  })
  contact?: number;
}
