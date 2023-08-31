import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
export class VerifyPasswordDto {
  @ApiProperty({ example: 'demoecoo1' })
  @IsNotEmpty()
  password: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
