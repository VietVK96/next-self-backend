import { ApiProperty } from '@nestjs/swagger';

export class ActsShowDto {
  @ApiProperty({
    required: true,
  })
  id?: number;

  @ApiProperty({
    required: true,
  })
  associations_group?: [any];

  @ApiProperty({
    required: true,
  })
  odontograms_group?: [any];

  @ApiProperty({
    required: true,
  })
  'traceability:read'?: string;

  @ApiProperty({
    required: true,
  })
  'attachment:read'?: number;

  @ApiProperty({
    required: true,
  })
  used_only?: boolean;
}
