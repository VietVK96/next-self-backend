import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import {
  UserPreferenceQuotationDisplayDetailsType,
  UserPreferenceViewType,
  UserPreferenceQuotationDisplayOdontogramType,
} from 'src/entities/user-preference.entity';

@ApiExtraModels()
export class UpdateTherapeuticDto {
  @ApiProperty({
    name: 'therapeutic_alternative',
    required: false,
  })
  therapeutic_alternative?: string[];
}

export class UpdatePreferenceDto {
  @ApiProperty({
    name: 'user',
    required: false,
  })
  user?: number;

  @ApiProperty({
    name: 'value',
    required: false,
  })
  value:
    | string
    | number
    | UserPreferenceQuotationDisplayOdontogramType
    | UserPreferenceViewType
    | UserPreferenceQuotationDisplayDetailsType;

  @ApiProperty({
    name: 'name',
    required: false,
  })
  name?: string;
}

export class UpdateTherapeuticParamDto {
  @ApiProperty({
    required: true,
  })
  user_id?: number;
}
