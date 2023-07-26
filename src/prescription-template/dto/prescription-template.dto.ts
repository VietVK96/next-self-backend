import { ApiProperty } from '@nestjs/swagger';

export class CreatePrescriptionTemplateDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  observation?: string;

  @ApiProperty()
  medicaments?: number[];
}
