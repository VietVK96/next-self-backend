import { ApiProperty } from '@nestjs/swagger';

export class GetOneActiveUserDoctorPermission {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  user_id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  active?: number;

  @ApiProperty()
  invoice?: number;

  @ApiProperty()
  payment?: number;

  @ApiProperty()
  accountancy?: number;
}

export class GetOneActiveUserDoctor {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  permission?: GetOneActiveUserDoctorPermission;
}

export class GetOneActiveUserPermission {
  @ApiProperty()
  library?: number;

  @ApiProperty()
  patient?: number;

  @ApiProperty()
  patient_view?: number;

  @ApiProperty()
  password?: number;

  @ApiProperty()
  permissionDelete?: number;
}

export class GetOneActiveUser {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  lastname?: string;

  @ApiProperty()
  firstname?: string;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  permission?: GetOneActiveUserPermission;
}

export class GetOneActiveRes {
  @ApiProperty()
  user?: GetOneActiveUser;

  @ApiProperty()
  doctors?: GetOneActiveUserDoctor[];
}
