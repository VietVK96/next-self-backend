import { ApiProperty } from '@nestjs/swagger';

export class CreateContraindicationsDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  bcbdextherId?: string;

  @ApiProperty()
  bcbdextherType?: number;
}
