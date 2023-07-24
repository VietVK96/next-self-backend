import { ApiProperty } from '@nestjs/swagger';

class Patient {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  last_name?: string;

  @ApiProperty()
  first_name?: string;

  @ApiProperty()
  civility_title?: {
    short_name?: string;
  };
}

class HeaderFooterInfo {
  id?: number;

  title?: string;

  body?: number;

  height?: number;
}

export class TranformDto {
  @ApiProperty()
  type?: string;

  @ApiProperty()
  patient?: Patient;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  body?: string;

  @ApiProperty()
  header?: HeaderFooterInfo;

  @ApiProperty()
  footer?: HeaderFooterInfo;

  @ApiProperty()
  correspondent?: { id?: number };
}
