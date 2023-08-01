import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicamentFamilyDto {
  @ApiProperty()
  name?: string;
}
