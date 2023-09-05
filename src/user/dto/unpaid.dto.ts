import { ApiProperty } from '@nestjs/swagger';

export class UnpaidDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  page?: number;

  @ApiProperty()
  per_page?: number;

  @ApiProperty()
  direction?: string;

  @ApiProperty()
  sort?: string;

  @ApiProperty({ isArray: true, type: String, required: false })
  filterParam?: string[];

  @ApiProperty({ isArray: true, type: String, required: false })
  filterValue?: string[];
}

export class printUnpaidDto {
  @ApiProperty()
  id?: number;

  @ApiProperty({
    required: false,
    default: 1,
  })
  page?: number;

  @ApiProperty({
    required: false,
    default: 25,
  })
  per_page?: number;

  @ApiProperty({
    required: false,
    examples: ['asc', 'desc'],
  })
  direction?: string;

  @ApiProperty({
    required: false,
  })
  sort?: string;

  @ApiProperty({
    required: false,
  })
  filterParam?: string[];

  @ApiProperty({
    required: false,
  })
  filterValue: (string | string[])[];
}
