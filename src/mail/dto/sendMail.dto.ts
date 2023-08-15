import { ApiProperty } from '@nestjs/swagger';

export class SendMailDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  patient?: boolean;

  @ApiProperty()
  correspondent?: boolean;

  @ApiProperty()
  other?: string[];
}
