import { ApiProperty } from '@nestjs/swagger';

export class AccountWzAgendaSubmitDto {
  @ApiProperty()
  calendarId?: string;
}
