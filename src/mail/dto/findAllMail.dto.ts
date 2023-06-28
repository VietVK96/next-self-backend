import { ApiProperty } from '@nestjs/swagger';
import { PersonInfoDto } from './relationClass.dto';

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
  created_at?: Date;

  @ApiProperty()
  updated_at?: Date;

  @ApiProperty()
  doctor?: PersonInfoDto;
}
