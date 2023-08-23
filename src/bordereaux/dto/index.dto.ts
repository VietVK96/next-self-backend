import { ApiProperty } from '@nestjs/swagger';

export class BordereauxDto {
  @ApiProperty()
  user_id?: number;

  @ApiProperty()
  page?: number;

  @ApiProperty()
  per_page?: number;

  @ApiProperty({ required: false })
  direction?: string;

  @ApiProperty({ required: false })
  sort?: string;

  @ApiProperty({ isArray: true, type: String, required: false })
  filterParam?: string[];

  @ApiProperty({ isArray: true, type: String, required: false })
  filterValue?: string[];
}

export class BordereauxStoreDto {
  @ApiProperty()
  bank_id?: number;

  @ApiProperty()
  payment_choice?: string;

  @ApiProperty()
  payment_id?: number[];
}
