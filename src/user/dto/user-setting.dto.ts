import { ApiProperty } from '@nestjs/swagger';

export class UpdatePassWordSettingDto {
  @ApiProperty({
    name: 'old_password',
    required: false,
  })
  old_password?: string;

  @ApiProperty({
    name: 'password',
    required: false,
  })
  password?: string;

  @ApiProperty({
    name: 'confirmation_password',
    required: false,
  })
  confirmation_password?: string;
}
