import { ApiProperty } from '@nestjs/swagger';

export class UpdateInfoBodyDto {
  @ApiProperty({
    required: false,
  })
  technique?: string;

  @ApiProperty({
    required: false,
  })
  title?: string;

  @ApiProperty({
    required: false,
  })
  goals?: string;

  @ApiProperty({
    required: false,
  })
  questions?: string;
}
