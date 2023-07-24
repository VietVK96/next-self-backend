import { ApiProperty } from '@nestjs/swagger';
export class TagDto {
  @ApiProperty()
  page?: number;

  @ApiProperty()
  per_page?: number;

  @ApiProperty()
  query?: string;
}

export class CreateUpdateTagDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  color?: string;
}
