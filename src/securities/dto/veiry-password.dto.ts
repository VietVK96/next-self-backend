import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class VerifyPasswordDto {
  @ApiProperty({ example: 'demoecoo1' })
  @IsNotEmpty()
  password: string;
}
