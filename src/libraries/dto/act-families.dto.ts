import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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
  @IsNotEmpty()
  @IsString()
  label?: string;

  @ApiProperty({
    required: false,
  })
  color?: {
    background?: string;
    foreground?: string;
  };

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
  color?: {
    background?: string;
    foreground?: string;
  };

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
