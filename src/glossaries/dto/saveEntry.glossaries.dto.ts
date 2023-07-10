import { ApiProperty } from '@nestjs/swagger';

export class saveGlossaryEntryPayload {
  @ApiProperty()
  content: string;

  @ApiProperty()
  glossary: string | number;
}
