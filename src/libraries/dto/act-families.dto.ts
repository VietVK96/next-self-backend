import { ApiProperty } from '@nestjs/swagger';

export class ActFamiliesDto {
  @ApiProperty({
    required: false,
  })
  used_only?: boolean;
}

export class ActFamiliesSearchDto {
  @ApiProperty({
    required: false,
  })
  search_term?: string;

  @ApiProperty({
    required: false,
  })
  serializer_groups?: string[];
}
