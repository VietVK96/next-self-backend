import { ApiProperty } from '@nestjs/swagger';

export class UpdateGoogleCalendarDto {
  @ApiProperty()
  code?: string;

  @ApiProperty()
  google_calendar_id?: string;
}
