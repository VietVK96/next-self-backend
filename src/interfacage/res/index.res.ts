import { ApiProperty } from '@nestjs/swagger';

export class MemoRes {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  resource?: {
    id?: number;
    name?: string;
    color?: {
      background?: string;
      foreground?: string;
    };

    use_default_color?: number;
  };

  @ApiProperty()
  date?: string;

  @ApiProperty()
  message?: string;
}
