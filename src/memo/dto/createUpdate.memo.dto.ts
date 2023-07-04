import { ApiProperty } from '@nestjs/swagger';

export class CreateUpdateMemoDto {
  @ApiProperty()
  date?: string | null;

  @ApiProperty()
  message?: string | null;

  @ApiProperty()
  resourceId?: string | null;
}
