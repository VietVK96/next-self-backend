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
