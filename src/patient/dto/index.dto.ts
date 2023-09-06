import { ApiProperty } from '@nestjs/swagger';

export class PatientStructDto {
  @ApiProperty()
  field?: string;

  @ApiProperty()
  op?: string;

  @ApiProperty()
  value?: string;
}

export class PatientContactDto {
  patients?: PatientStructDto[];
}

export class PatientExportDto {
  @ApiProperty()
  format?: string;
}

export class PatientThirdPartyDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  page?: number;

  @ApiProperty()
  per_page?: number;

  @ApiProperty()
  direction?: string;

  @ApiProperty()
  sort?: string;

  @ApiProperty({ isArray: true, type: String, required: false })
  filterParam?: string[];

  @ApiProperty({ isArray: true, type: String, required: false })
  filterValue?: string[];
}

export class PatientActsDependenciesDto {
  @ApiProperty({ required: false })
  quote_id?: number;

  @ApiProperty()
  status?: number;

  @ApiProperty({
    name: 'teethNumbers[]',
  })
  teethNumbers?: number[];

  @ApiProperty()
  library_act_id?: number;

  @ApiProperty()
  patient_id?: number;

  @ApiProperty({ required: false })
  grid?: number;

  @ApiProperty({ required: false })
  check_parent?: boolean;
}

export class RelauchDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  user_id?: number;
}
