import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @MinLength(5)
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsEmail()
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  email?: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty({
    message: 'The password must not be empty.',
  })
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, {
    message:
      'The password must be at least 8 characters long and contain a lowercase letter, an uppercase letter, a number and a special character.',
  })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  password?: string;
}
