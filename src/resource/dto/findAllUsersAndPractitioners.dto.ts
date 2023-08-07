import { ApiProperty } from '@nestjs/swagger';

export class FindAllUsersAndPractitionersDto {
  @ApiProperty()
  practitioners?: User[];

  @ApiProperty()
  users?: User[];
}

export class User {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  fullName?: string;
}
