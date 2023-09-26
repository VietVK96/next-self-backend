import { ApiProperty } from '@nestjs/swagger';

export class BcbDto {
  @ApiProperty({
    name: 'license',
    required: false,
  })
  license?: number;

  @ApiProperty({
    name: 'type',
    required: false,
  })
  type?: number;

  @ApiProperty({
    name: 'baseLocation',
    required: false,
  })
  baseLocation?: number;

  @ApiProperty({
    name: 'query',
    required: false,
  })
  query?: string;
}

export class BcbFindOneDto {
  @ApiProperty({
    name: 'license',
    required: false,
  })
  license?: number;

  @ApiProperty({
    name: 'id',
    required: false,
  })
  id?: string;

  @ApiProperty({
    name: 'baseLocation',
    required: false,
  })
  contactId?: number;
}
