import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class DevisStd2Dto {
  @ApiProperty({
    name: 'id_user',
    required: false,
    nullable: true,
  })
  id_user?: number = null;

  @ApiProperty({
    name: 'id_contact',
    required: false,
    nullable: true,
  })
  id_contact?: number = null;

  @ApiProperty({
    name: 'no_pdt',
    required: false,
    nullable: true,
  })
  no_pdt?: number = null;

  @ApiProperty({
    name: 'no_devis',
    required: false,
  })
  no_devis?: number;

  @ApiProperty({
    name: 'caresheet_id',
    required: false,
    nullable: true,
  })
  caresheet_id?: number = null;

  @ApiProperty({
    name: 'payment_id',
    required: false,
    nullable: true,
  })
  payment_id?: number = null;

  pdf?: boolean;
}
