import { ApiProperty } from '@nestjs/swagger';

export class BaseClaudeBernardCheckDto {
  @ApiProperty()
  license: number;

  @ApiProperty()
  contact: number;

  @ApiProperty()
  prescriptionIds: number[];
}
