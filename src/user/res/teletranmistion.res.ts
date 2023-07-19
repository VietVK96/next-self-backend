import { ApiProperty } from '@nestjs/swagger';

export class SaveTeletranmistionDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  finess_number?: string;

  @ApiProperty()
  external_reference_id?: number;
}
