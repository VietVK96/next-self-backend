import { ApiProperty } from '@nestjs/swagger';

export class FindAllEventDto {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  start_date?: string;

  @ApiProperty()
  end_date?: string;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  observation?: string;

  @ApiProperty()
  color?: {
    background?: string;
    foreground?: string;
  };

  @ApiProperty()
  state?: number;

  @ApiProperty()
  lateness?: number;

  @ApiProperty()
  startTime?: string;

  @ApiProperty()
  endTime?: string;

  @ApiProperty()
  creationDate?: string;

  @ApiProperty()
  resourceId?: number;

  @ApiProperty()
  resourceName?: string;

  @ApiProperty()
  number?: number;

  @ApiProperty()
  lastName?: string;

  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  birthDate?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  civilityTitle?: string;

  @ApiProperty()
  RMD_FLAG?: number;

  @ApiProperty()
  RMD_NAME?: number;

  @ApiProperty()
  homePhoneNumber?: string;

  @ApiProperty()
  mobilePhoneNumber?: string;

  @ApiProperty()
  smsPhoneNumber?: string;

  @ApiProperty()
  age?: string;

  @ApiProperty()
  clasName?: string;

  @ApiProperty()
  resource?: {
    id?: number;
    name?: string;
  };
}
