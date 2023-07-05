import { ApiProperty } from '@nestjs/swagger';

export class ActFamiliesDto {
  @ApiProperty({
    required: false,
  })
  used_only?: boolean;
}
