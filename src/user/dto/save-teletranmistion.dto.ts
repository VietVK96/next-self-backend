import { ApiProperty } from '@nestjs/swagger';

export class SaveTeletranmistionDto {
  @ApiProperty()
  external_reference_id?: number;
}
