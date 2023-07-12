import { ApiProperty } from '@nestjs/swagger';

export class ValidationDto {
  @ApiProperty({ example: 'demoecoo1' })
  username?: string;

  @ApiProperty({ example: 'demoecoo1' })
  password?: string;
}
