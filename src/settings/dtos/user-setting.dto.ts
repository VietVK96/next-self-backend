import { ApiProperty } from '@nestjs/swagger';
export class UpdatePassWordDto {
  @ApiProperty({
    name: 'password',
    required: false,
  })
  password?: string;

  @ApiProperty({
    name: 'new_password',
    required: false,
  })
  new_password?: string;

  @ApiProperty({
    name: 'confirm_password',
    required: false,
  })
  confirm_password?: string;
}
