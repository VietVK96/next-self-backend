import { ApiProperty } from '@nestjs/swagger';

export class ValidationDto {
  @ApiProperty({ example: 'demoecoo1' })
  email?: string;

  @ApiProperty({ example: 'demoecoo1' })
  password?: string;
}
