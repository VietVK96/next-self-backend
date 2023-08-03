import { ApiProperty } from '@nestjs/swagger';
import { EnumLibraryActQuantityExceeding } from 'src/entities/library-act-quantity.entity';
import { EnumLibraryActNomenclature } from '../../entities/library-act.entity';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ActsShowDto {
  @ApiProperty({
    required: true,
  })
  id?: number;

  @ApiProperty({
    required: true,
  })
  associations_group?: [any];

  @ApiProperty({
    required: true,
  })
  odontograms_group?: [any];

  @ApiProperty({
    required: true,
  })
  'traceability:read'?: string;

  @ApiProperty({
    required: true,
  })
  'attachment:read'?: number;

  @ApiProperty({
    required: true,
  })
  used_only?: boolean;
}
