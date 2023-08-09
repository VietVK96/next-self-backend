import { ApiProperty } from '@nestjs/swagger';

export class PrintReq {
  @ApiProperty({
    required: false,
  })
  start?: string;

  @ApiProperty({
    required: false,
  })
  end?: string;

  @ApiProperty({
    required: false,
  })
  resources?: number[];

  @ApiProperty({
    required: false,
    default: 'week',
  })
  view?: string;

  @ApiProperty({
    required: false,
  })
  pbw?: boolean;
}
