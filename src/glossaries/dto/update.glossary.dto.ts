import { ApiProperty } from '@nestjs/swagger';

export class UpdateGlossaryDto {
  @ApiProperty()
  name?: string;
}
