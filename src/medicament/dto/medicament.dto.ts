import { ApiProperty } from '@nestjs/swagger';

export class SearchMedicamentDto {
  @ApiProperty()
  name?: string;
}

export class CreateMedicamentDto {
  @ApiProperty()
  mdtId?: number;

  @ApiProperty()
  abbreviation?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  format?: string;

  @ApiProperty()
  dosage?: string;

  @ApiProperty()
  posologie?: string;

  @ApiProperty()
  contraindications?: number[];

  @ApiProperty()
  bcbdextherId?: number;
}
