import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationAddress {
  @ApiProperty()
  street?: string;

  @ApiProperty()
  street2?: string;

  @ApiProperty()
  zip_code?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  country_code?: string;
}

export class UpdateOrganizationSetting {
  @ApiProperty()
  patientNumberEditable?: number;

  @ApiProperty()
  odontogramObservation?: string;
}

export class UpdateOrganizationDto {
  @ApiProperty()
  logo?: Express.Multer.File;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  phone_number?: string;

  @ApiProperty()
  image_library_link?: string;

  @ApiProperty()
  mode_desynchronise: number;

  @ApiProperty()
  address?: UpdateOrganizationAddress;

  @ApiProperty()
  settings?: UpdateOrganizationSetting;

  @ApiProperty()
  delete_logo?: number;
}