import { ApiProperty } from '@nestjs/swagger';

export class UpdateFileDto {
  @ApiProperty()
  original_filename?: string;

  @ApiProperty()
  tags?: number[];
}
