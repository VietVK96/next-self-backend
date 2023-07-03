import { ApiProperty } from '@nestjs/swagger';

export class FamilyContactDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  target?: number;

  @ApiProperty()
  action?: string;

  @ApiProperty()
  contact?: number;
}
