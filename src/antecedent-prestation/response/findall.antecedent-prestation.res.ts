import { ApiProperty } from '@nestjs/swagger';

export class FindAllAntecedentPrestationRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  teeth?: string;
}
