import { ApiProperty } from '@nestjs/swagger';
import { isArray } from 'class-validator';

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
