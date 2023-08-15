import { ApiProperty } from '@nestjs/swagger';

export class CreateContraindicationsDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  bcbdextherId?: string;

  @ApiProperty()
  bcbdextherType?: number;
}

export class SortableContraindicationsDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  position?: number;
}
