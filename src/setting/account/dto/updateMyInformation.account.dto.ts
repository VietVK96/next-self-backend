import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

class MedicalStruct {
  @ApiProperty()
  @MinLength(11)
  @MaxLength(11)
  rpps_number?: string;
}
export class UpdateMyInformationDto {
  @ApiProperty()
  @IsString()
  log?: string;

  @ApiProperty()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsString()
  short_name?: string;

  @ApiProperty()
  @IsString()
  phoneNumber?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  gsm?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(45)
  faxNumber?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => MedicalStruct)
  medical?: MedicalStruct;

  @ApiProperty()
  @IsString()
  @MaxLength(9)
  finess?: string;

  @ApiProperty()
  @IsString()
  company_name?: string;

  @ApiProperty()
  street?: string;

  @ApiProperty()
  zip_code?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  countryAbbr?: string;

  @ApiProperty()
  rateCharges?: string;

  @ApiProperty()
  signature?: string;

  @ApiProperty()
  amo?: {
    code_convention?: number;
  };

  @ApiProperty()
  @IsNumber()
  social_security_reimbursement_base_rate?: number;

  @ApiProperty()
  @IsNumber()
  social_security_reimbursement_rate?: number;

  @ApiProperty()
  @IsNumber()
  freelance?: number;

  @ApiProperty()
  agaMember?: number;

  @ApiProperty()
  droit_permanent_depassement?: number;

  @ApiProperty()
  @IsNumber()
  signature_automatic: number;
}
