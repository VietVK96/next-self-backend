import { ApiProperty } from '@nestjs/swagger';

export class AcFamiliesCopyRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  label?: string;

  @ApiProperty()
  color?: {
    background?: string;
    foreground?: string;
  };

  @ApiProperty()
  position?: number;

  @ApiProperty()
  used?: boolean;
}
