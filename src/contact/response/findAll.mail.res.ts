import { ApiProperty } from '@nestjs/swagger';

export class FindAllMailRes {
  @ApiProperty()
  draw: string | number;

  @ApiProperty()
  recordsTotal: number;

  @ApiProperty()
  recordsFiltered: number;

  @ApiProperty()
  data: DoctorRes[];
}

export class DoctorRes {
  id: number | string;
  lastname: string;
  firstname: string;
  email: string;
}
