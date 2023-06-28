import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { EnumPlanPlfType } from 'src/entities/plan-plf.entity';

@ApiExtraModels()
export class FindAllStructDto {
  @ApiProperty({
    required: false,
  })
  draw?: number;

  @ApiProperty({
    name: '[column]',
    required: false,
  })
  column?: string;

  @ApiProperty({
    required: false,
  })
  start?: number;

  @ApiProperty({
    required: false,
  })
  length?: number;

  @ApiProperty({
    name: '{search}',
    required: false,
  })
  search?: string;

  @ApiProperty({
    required: false,
  })
  patientId?: number;

  @ApiProperty({
    required: false,
  })
  type?: EnumPlanPlfType;
}
