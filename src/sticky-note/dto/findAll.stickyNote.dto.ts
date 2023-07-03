import { ApiProperty } from '@nestjs/swagger';

export class FindAllStickyNoteDto {
  @ApiProperty()
  contact?: number;
}
