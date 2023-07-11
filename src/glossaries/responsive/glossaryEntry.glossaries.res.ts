import { ApiProperty } from '@nestjs/swagger';

export class GlossaryEntryRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  position: number;
}
