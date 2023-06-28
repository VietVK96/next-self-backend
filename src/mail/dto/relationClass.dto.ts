import { ApiProperty } from '@nestjs/swagger';

export class PersonInfoDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  email?: string;
}

export class HeaderFooterInfo {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  body?: number;

  @ApiProperty()
  height?: number;
}
