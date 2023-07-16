import { ApiProperty } from '@nestjs/swagger';

export class CreateTimeslotPayloadDto {
  @ApiProperty()
  title?: string;

  @ApiProperty()
  recurring?: boolean;

  @ApiProperty()
  color?: {
    background?: string;
    foreground?: string;
  };

  @ApiProperty()
  start_date?: string;

  @ApiProperty()
  end_date?: string;

  @ApiProperty()
  resourceId?: number;

  @ApiProperty()
  recurring_pattern?: {
    until?: string;
    week_frequency?: number;
    week_days?: string[];
  };
}
