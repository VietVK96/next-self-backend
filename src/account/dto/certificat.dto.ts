import { ApiProperty } from '@nestjs/swagger';

export class CreateCertificatDto {
  @ApiProperty({
    required: true,
  })
  cookie?: string;
}
