import { ApiProperty } from '@nestjs/swagger';

export class UpdateNgapKeyDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  used?: number;

  @ApiProperty()
  unitPrice?: number;

  @ApiProperty()
  agreeRefreshAmount?: number;
}
