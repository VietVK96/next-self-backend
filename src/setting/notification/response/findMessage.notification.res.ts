import { ApiProperty } from '@nestjs/swagger';

export class FindMessageNotificationRes {
  @ApiProperty()
  messages: { [key: string]: string };

  @ApiProperty()
  defaultMessage: string;
}
