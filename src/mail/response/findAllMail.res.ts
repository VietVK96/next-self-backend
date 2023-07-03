import { ApiProperty } from '@nestjs/swagger';
import { FindAllMailDto } from '../dto/findAllMail.dto';

export class FindAllMailRes {
  @ApiProperty()
  draw?: string;

  @ApiProperty()
  recordsTotal?: number;

  @ApiProperty()
  recordsFiltered?: number;

  @ApiProperty()
  totalData?: number;

  @ApiProperty()
  data?: FindAllMailDto[];
}
