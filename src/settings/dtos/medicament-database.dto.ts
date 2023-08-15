import { ApiProperty } from '@nestjs/swagger';

export class FindMedicamentDatabaseDto {
  @ApiProperty()
  query?: string;

  @ApiProperty()
  type?: number;

  @ApiProperty()
  baseLocation?: number;
}

export class FindDetailMedicamentDatabaseDto {
  @ApiProperty()
  produitId?: number;

  @ApiProperty()
  patientId?: number;
}
