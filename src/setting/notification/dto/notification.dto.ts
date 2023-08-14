import { ApiProperty } from '@nestjs/swagger';

export class SaveSmsShareDto {
  @ApiProperty()
  smsShared?: number;
}
