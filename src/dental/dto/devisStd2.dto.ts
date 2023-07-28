import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { EnumMedicalHeaderFormatType } from 'src/entities/medical-header.entity';

@ApiExtraModels()
export class DevisStd2Dto {
  @ApiProperty({
    name: 'id_user',
    required: false,
  })
  id_user?: number;

  @ApiProperty({
    name: 'id_contact',
    required: false,
  })
  id_contact?: number;

  @ApiProperty({
    name: 'no_pdt',
    required: false,
  })
  no_pdt?: number;

  @ApiProperty({
    name: 'no_devis',
    required: false,
  })
  no_devis?: number;

  pdf?: boolean;
}
