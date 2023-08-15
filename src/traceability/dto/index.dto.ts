import { ApiProperty } from '@nestjs/swagger';

export class TraceabilitiesRequestDto {
  @ApiProperty()
  page?: number;

  @ApiProperty()
  per_page?: number;

  @ApiProperty({ isArray: true, type: String, required: false })
  filterParam?: string[];

  @ApiProperty({ isArray: true, type: String, required: false })
  filterValue?: string[];
}

export class TraceabilitiesItemDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  reference?: string;

  @ApiProperty()
  observation?: string;

  @ApiProperty()
  act?: {
    id?: number;
    date?: string;
    patient?: {
      id?: number;
      lastname?: string;
      firstname?: string;
    };
  };

  @ApiProperty()
  medicalDevice?: {
    id?: number;
    name?: string;
  };
}
