import { ApiProperty } from '@nestjs/swagger';

export class ThirdPartyDto {
  @ApiProperty()
  user_id?: number;

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
