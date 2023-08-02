import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class SectionsDsioDto {
  @ApiProperty()
  Praticiens?: {
    [key: number]: string;
  };

  @ApiProperty()
  Agendas?: {
    [key: number]: string;
  };
}

export class ImporterDsioDto {
  @ApiProperty()
  pathname?: string;

  @ApiProperty()
  patient_number?: number | null;

  @ApiProperty()
  sections?: SectionsDsioDto;
}
