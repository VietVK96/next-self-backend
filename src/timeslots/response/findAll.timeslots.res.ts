import { ApiProperty } from '@nestjs/swagger';

export class TimeslotsAllRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  resource?: {
    id?: number;
    name?: string;
  };

  @ApiProperty()
  start_date?: string;

  @ApiProperty()
  end_date?: string;

  @ApiProperty()
  color?: {
    background: string;
    foreground: string;
  };

  @ApiProperty()
  title?: string;
}

export class TimeslotRes {
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
  recurring_pattern?: {
    id?: number;
    week_frequency?: number;
    week_days?: string[];
    until?: string;
  };
  @ApiProperty()
  start_date?: string;
  @ApiProperty()
  end_date?: string;
  @ApiProperty()
  color: {
    background?: string;
    foreground?: string;
  };
  @ApiProperty()
  title?: string;
}
