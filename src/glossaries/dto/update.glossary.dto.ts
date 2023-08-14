import { ApiProperty } from '@nestjs/swagger';

export class UpdateGlossaryDto {
  @ApiProperty()
  name?: string;
}

export class SortGlossaryDto {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  position?: number;
  @ApiProperty()
  name?: string;
}
