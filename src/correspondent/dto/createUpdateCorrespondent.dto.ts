import { ApiProperty } from '@nestjs/swagger';

export class CreateUpdateCorrespondentDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  civility?: {
    id?: number;
  };

  @ApiProperty()
  type?: {
    id?: number;
    name?: string;
  };

  @ApiProperty()
  address?: {
    id?: string;
    street?: string;
    street_comp?: string;
    zip_code?: string;
    city?: string;
    country?: string;
    country_code?: string;
  };

  @ApiProperty()
  phones?: phoneStruct[];
}

export class phoneStruct {
  @ApiProperty()
  nbr?: string;

  @ApiProperty()
  phoneTypeId?: number;

  @ApiProperty()
  type?: {
    id?: number;
    name?: string;
  };
}
