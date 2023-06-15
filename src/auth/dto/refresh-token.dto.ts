import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @MinLength(5)
  @ApiProperty({
    required: true,
  })
  refreshToken: string;
}
