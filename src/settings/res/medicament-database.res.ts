import { ApiProperty } from '@nestjs/swagger';

export class FindMedicamentDatabaseContraindicationRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  type?: string;

  @ApiProperty()
  libelle?: string;
}

export class FindMedicamentDatabaseRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  libelleCourt?: string;

  @ApiProperty()
  libelle?: string;

  @ApiProperty()
  libelleDCMolecule?: string;

  @ApiProperty()
  libellePresentation?: string;

  @ApiProperty()
  libellePosologie?: string;
}
