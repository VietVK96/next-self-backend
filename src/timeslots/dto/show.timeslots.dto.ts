import { ApiProperty } from '@nestjs/swagger';

export class TimeslotsDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  resourceId?: number;

  @ApiProperty()
  recurringPatternId?: number;

  @ApiProperty()
  start_date?: string;

  @ApiProperty()
  end_date?: string;

  @ApiProperty()
  color?: {
    background?: string;
    foreground?: string;
  };

  @ApiProperty()
  title?: string;
}

export class ResourceDto {}
