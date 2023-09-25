import { ApiProperty } from '@nestjs/swagger';

export class ShowImagingSoftwareQueryDto {
  @ApiProperty()
  contactId?: number;

  @ApiProperty()
  practitionerId?: number;
}
