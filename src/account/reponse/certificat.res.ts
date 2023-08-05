import { ApiProperty } from '@nestjs/swagger';

export class CertificateRes {
  @ApiProperty()
  user?: {
    id: number;
    log: string;
    admin: number;
  };

  @ApiProperty()
  certificate?: null;
}
