import { ApiProperty } from '@nestjs/swagger';

export class SortablePrescriptionTemplateDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  id?: number;

  @ApiProperty()
  position?: number;
}
export class CreatePrescriptionTemplateDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  observation?: string;

  @ApiProperty()
  medicaments?: Medicament[];
}

class Medicament {
  position?: number;
  id?: number;
  mdtId?: number;
  name?: string;
  abbreviation?: string;
  format?: number | string | null;
  dosage?: number | string | null;
  posologie?: string;
  bcbdextherId?: number;
  internalReference?: string;
  organizationId?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
