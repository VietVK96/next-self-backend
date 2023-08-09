import { ApiProperty } from '@nestjs/swagger';

export class ICcamRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  family?: {
    id: number;
    code: string;
    label: string;
  };

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  short_name: string;

  @ApiProperty()
  created_on: string;
}
