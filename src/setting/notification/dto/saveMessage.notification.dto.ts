import { ApiProperty } from '@nestjs/swagger';

export class SaveMessageNotificationDto {
  @ApiProperty()
  sms?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  'pop-up'?: string;
}
