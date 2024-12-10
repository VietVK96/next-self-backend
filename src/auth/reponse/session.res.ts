import { ApiProperty } from '@nestjs/swagger';
export class UserResourceRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  color?: {
    background?: string;
    foreground?: string;
  };

  @ApiProperty()
  doctorId?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  practitionerName?: string;

  @ApiProperty()
  use_default_color?: boolean;
}
