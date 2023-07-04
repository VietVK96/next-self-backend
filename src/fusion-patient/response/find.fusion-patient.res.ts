import { ApiProperty } from '@nestjs/swagger';

export class FindFusionPatientRes {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nbr: number;

  @ApiProperty()
  fistname: string;

  @ApiProperty()
  lastname: string;

  @ApiProperty()
  birthday?: string;

  @ApiProperty()
  insee?: string;

  @ApiProperty()
  inseeKey?: string;

  @ApiProperty()
  recordCount?: {
    [key: string]: number;
  };
}
