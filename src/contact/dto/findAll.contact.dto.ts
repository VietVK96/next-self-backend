import { ApiProperty } from '@nestjs/swagger';

export class FindAllStructDto {
  @ApiProperty()
  field?: string;

  @ApiProperty()
  op?: string;

  @ApiProperty()
  value?: string;
}

export class FindAllContactDto {

  conditions?: FindAllStructDto[];
}
