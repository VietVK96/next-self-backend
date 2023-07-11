import { ApiProperty } from '@nestjs/swagger';

export class SaveGlossaryDto {
  @ApiProperty()
  name: string;
}
