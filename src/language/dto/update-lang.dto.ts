import { ApiProperty } from '@nestjs/swagger';

export class UpdateLangDto {
  @ApiProperty()
  key: string;
}
