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

  @ApiProperty()
  filterParam?: string[];

  @ApiProperty()
  filterValue?: string[];
}
