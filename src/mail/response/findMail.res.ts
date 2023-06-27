import { ApiProperty } from '@nestjs/swagger';
import { HeaderFooterInfo, PersonInfoDto } from '../dto/relationClass.dto';

export class FindMailRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  body?: string;

  @ApiProperty()
  footer_content?: string;

  @ApiProperty()
  footer_height?: number;

  @ApiProperty()
  height?: number;

  @ApiProperty()
  favorite?: number;

  @ApiProperty()
  created_at?: Date;

  @ApiProperty()
  updated_at?: Date;

  @ApiProperty()
  doctor?: PersonInfoDto;

  @ApiProperty()
  patient?: PersonInfoDto;

  @ApiProperty()
  conrrespondent?: PersonInfoDto;

  @ApiProperty()
  header?: HeaderFooterInfo;

  @ApiProperty()
  footer?: HeaderFooterInfo;
}
