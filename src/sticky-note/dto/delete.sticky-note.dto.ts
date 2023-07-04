import { ApiProperty } from '@nestjs/swagger';

export class DeleteStickyNoteDto {
  @ApiProperty()
  id?: number;
}
