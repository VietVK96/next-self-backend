import { ApiProperty } from '@nestjs/swagger';

export class FindAllMailDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  doctor_id?: number;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  favorite?: number;

  @ApiProperty()
  created_at?: string;

  @ApiProperty()
  updated_at?: string;
}
