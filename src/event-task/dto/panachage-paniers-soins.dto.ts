import { ApiProperty } from '@nestjs/swagger';

export class PanachagePaniersSoinsDto {
  @ApiProperty()
  tooth_numbers?: string;

  @ApiProperty()
  ccam_panier_code?: number;
}
