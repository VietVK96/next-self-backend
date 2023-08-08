import { ApiProperty } from '@nestjs/swagger';

export class MedicalUser {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  finessNumber?: string;

  @ApiProperty()
  nationalIdentifierNumber?: string;
}
export class ConsulterUtlUser {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  medical?: MedicalUser;
}

export class ConsulterUtlDto {
  @ApiProperty()
  user?: ConsulterUtlUser[];
}
