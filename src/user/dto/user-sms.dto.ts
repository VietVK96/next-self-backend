import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserSmsDto {
  @ApiProperty({
    required: true,
  })
  users: {
    id?: number;
    sms?: {
      quantity?: number;
    };
  }[];
}
