import { ApiProperty } from '@nestjs/swagger';

export class UpdateGlossaryEntryDto {
  @ApiProperty()
  content?: string;
}
