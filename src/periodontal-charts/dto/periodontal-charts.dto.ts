import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { EnumPlanPlfType } from 'src/entities/plan-plf.entity';

@ApiExtraModels()
export class CreateChartsDto {
  @ApiProperty({
    required: false,
  })
  id?: number;

  @ApiProperty({
    required: false,
  })
  bleeding_on_probing?: number;

  @ApiProperty({
    required: false,
  })
  creation_date?: string;

  @ApiProperty({
    required: false,
  })
  gingival_margin?: number;

  @ApiProperty({
    required: false,
  })
  matrix?: object;

  @ApiProperty({
    required: false,
  })
  patient_id?: number;

  @ApiProperty({
    required: false,
  })
  plaque?: number;

  @ApiProperty({
    required: false,
  })
  probing_depth?: number;

  @ApiProperty({
    required: false,
  })
  status?: number;

  @ApiProperty({
    required: false,
  })
  status_readable?: string;

  @ApiProperty({
    required: false,
  })
  user_id?: string;
}

export class IndexDto {
  @ApiProperty({
    required: false,
  })
  patient_id?: number;
}

export class visibilityDto {
  @ApiProperty({
    required: false,
  })
  patient_id?: number;
}

export class ShowDto {
  @ApiProperty({
    required: false,
  })
  id?: number;
}
