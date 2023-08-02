import { ApiProperty } from '@nestjs/swagger';
import { EnumLibraryActQuantityExceeding } from 'src/entities/library-act-quantity.entity';
import { EnumLibraryActNomenclature } from '../../entities/library-act.entity';
import {
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

export class ActsStoreFamilyColorDto {
  @ApiProperty({
    required: false,
    default: null,
  })
  @IsOptional()
  @IsString()
  background?: string;

  @ApiProperty({
    required: false,
    default: null,
  })
  @IsOptional()
  @IsString()
  foreground?: string;
}

export class ActsStoreFamilyDto {
  @ApiProperty({
    required: false,
  })
  @ValidateNested()
  color?: ActsStoreFamilyColorDto;

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  position?: number;

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
  id?: number;

  @ApiProperty({
    required: false,
    default: '',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  internal_reference_id?: number;

  @ApiProperty({
    required: false,
  })
  @ValidateNested()
  acts?: ActsStoreFamilyActsDto[];
}

export class ActsStoreFamilyQuantitiesCcamDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  id?: number;
}

export class ActsStoreFamilyQuantitiesNgapKeyDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  id?: number;
}

export class ActsStoreTraceabilitiesDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  medical_device_id?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  observation?: string;
}

export class ActsStoreFamilyQuantitiesDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  ccam?: ActsStoreFamilyQuantitiesCcamDto;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  ngapKey?: ActsStoreFamilyQuantitiesNgapKeyDto;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  descriptive_text?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  number_of_teeth?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  coefficient?: number;

  @ApiProperty({
    name: 'exceeding',
    type: 'enum',
    required: false,
  })
  @IsEnum(EnumLibraryActQuantityExceeding)
  exceeding?: EnumLibraryActQuantityExceeding;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  buying_price?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  materials?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  traceability_activated?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  traceability_merged?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  transmitted?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  used?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  odontograms?: [any];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  traceabilities?: [any];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  tariffs?: [any];
}

export class ActsStoreAssociationsChildDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  observation?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  position?: number;

  @ApiProperty({
    required: false,
    default: EnumLibraryActNomenclature.CCAM,
  })
  nomenclature?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  traceability_activated?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  transmitted?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  used?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  selected?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  attachment_count?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  traceabilities?: any[];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  quantities?: any[];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  odontograms?: any[];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  associations?: any[];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  complementaries?: any[];
}

export class ActsStoreAssociationsDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  position?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  automatic?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  child?: ActsStoreAssociationsChildDto;
}

export class ActsStoreAttachmentsDoctorDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;
}

export class ActsStoreAttachmentsDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  type?: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  doctor_id?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  favorite?: number;

  @ApiProperty({
    required: false,
  })
  doctor?: [any];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  created_at?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  updated_at?: string;
}

export class ActsStoreFamilyActsDto {
  @ApiProperty({
    required: false,
    default: null,
  })
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  position?: number;

  @ApiProperty({
    required: false,
    default: EnumLibraryActNomenclature.CCAM,
  })
  nomenclature?: string;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @IsNumber()
  traceability_activated?: number;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @IsNumber()
  transmitted?: number;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @IsNumber()
  used?: number;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @IsNumber()
  selected?: number;

  @ApiProperty({
    required: false,
    default: '',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  internal_reference_id?: number;

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  attachment_count?: number;

  @ApiProperty({
    required: false,
    default: 0,
  })
  attachments?: [any];

  @ApiProperty({
    required: false,
    default: 0,
  })
  @ValidateNested()
  quantities?: ActsStoreFamilyQuantitiesDto[];

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  odontograms?: [any];

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  associations?: [any];

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  complementaries?: [any];

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  traceabilities?: [any];
}

export class ActsStoreDto {
  @ApiProperty({
    required: false,
    default: '',
  })
  @IsOptional()
  @MaxLength(255)
  label?: string;

  @ApiProperty({
    required: false,
    default: '',
  })
  @IsOptional()
  @IsString()
  descriptive_text?: string;

  @ApiProperty({
    required: false,
    default: '',
  })
  @IsOptional()
  materials?: [any];

  @ApiProperty({
    required: false,
    default: null,
  })
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsOptional()
  position?: number;

  @ApiProperty({
    required: false,
    default: EnumLibraryActNomenclature.CCAM,
  })
  nomenclature?: string;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  traceability_activated?: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  transmitted?: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  used?: boolean;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  selected?: boolean;

  @ApiProperty({
    required: false,
    default: 0,
  })
  @ValidateNested()
  family?: ActsStoreFamilyDto;

  @ApiProperty({
    required: false,
  })
  @ValidateNested()
  attachments?: ActsStoreAttachmentsDto[];

  @ApiProperty({
    required: false,
  })
  @ValidateNested()
  quantities?: ActsStoreFamilyQuantitiesDto[];

  @ApiProperty({
    required: false,
    default: [],
  })
  odontograms?: [any];

  @ApiProperty({
    required: false,
  })
  associations?: ActsStoreAssociationsDto[];

  @ApiProperty({
    required: false,
  })
  complementaries?: [any];

  @ApiProperty({
    required: false,
  })
  @ValidateNested()
  traceabilities?: ActsStoreTraceabilitiesDto[];

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  medical_device_id?: number;
}
