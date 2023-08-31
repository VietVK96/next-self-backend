import { ApiProperty } from '@nestjs/swagger';

export class StoreCommunicationFsdDto {
  @ApiProperty()
  color?: number;

  @ApiProperty()
  width?: number;

  @ApiProperty()
  height?: number;

  @ApiProperty()
  content?: string;
}
