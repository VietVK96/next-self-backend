import { ApiProperty } from '@nestjs/swagger';

export class TranformVariableParam {
  @ApiProperty()
  message?: string;

  @ApiProperty()
  groupId?: number;

  @ApiProperty()
  practitionerId?: number;

  @ApiProperty()
  patientId?: number;

  @ApiProperty()
  correspondentId?: number;
}
