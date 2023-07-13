import { ApiProperty } from '@nestjs/swagger';

export class FindGlossariesRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  position: number;

  @ApiProperty()
  entry_count: number;
}
