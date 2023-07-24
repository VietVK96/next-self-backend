import { ApiProperty } from '@nestjs/swagger';

export class FindAllMailRes {
  @ApiProperty()
  draw: string | number;

  @ApiProperty()
  recordsTotal: number;

  @ApiProperty()
  recordsFiltered: number;

  @ApiProperty()
  data: DataRes[];
}

export class DataRes {
  id: number;
  doctor_id: number;
  title: string;
  type: string;
  favorite: number;
  created_at: string;
  updated_at: string;
  doctor: DoctorRes;
}

export class DoctorRes {
  id: number | string;
  lastname: string;
  firstname: string;
  email: string;
}
