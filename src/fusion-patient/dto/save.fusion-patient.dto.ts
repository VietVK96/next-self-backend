import { ApiProperty } from '@nestjs/swagger';

export class SaveFusionPatientDto {
  @ApiProperty()
  numeroDossierAConserver?: number;

  @ApiProperty()
  numeroDossierASupprimer?: number;
}
