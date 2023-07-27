import { ApiProperty } from '@nestjs/swagger';

export class SearchMedicamentDto {
  @ApiProperty()
  name?: string;
}
