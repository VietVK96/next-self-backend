import { ApiProperty } from '@nestjs/swagger';

export class StoreOrgFsdDto {
  @ApiProperty()
  organization_id?: number;
}
