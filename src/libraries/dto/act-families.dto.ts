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

export class ActFamiliesDto {
  @ApiProperty({
    required: false,
  })
  used_only?: boolean;
}

export class ActFamiliesStoreDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    required: false,
  })
  color?: string;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  used?: boolean;
}

export class ActFamiliesSearchDto {
  @ApiProperty({
    required: false,
  })
  search_term?: string;

  @ApiProperty({
    required: false,
  })
  serializer_groups?: string[];
}

export class ActsIndexDto {
  @ApiProperty({
    required: true,
  })
  search_term?: string;

  @ApiProperty({
    required: true,
  })
  only_used?: boolean;
}

export class ActFamiliesUpdateDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    required: false,
  })
  color?: string;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  used?: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  position?: number;
}
