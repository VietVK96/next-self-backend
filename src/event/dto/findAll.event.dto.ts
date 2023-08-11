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
  color?: number;

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
  patientId?: number;

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
  RMT_NAME?: number;

  @ApiProperty()
  homePhoneNumber?: string;

  @ApiProperty()
  mobilePhoneNumber?: string;

  @ApiProperty()
  smsPhoneNumber?: string;

  @ApiProperty()
  age?: string;

  @ApiProperty()
  className?: string;

  @ApiProperty()
  resource?: {
    id?: number;
    name?: string;
  };

  @ApiProperty()
  row?: string;
}

export class BgEventDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  resourceId: number;

  @ApiProperty()
  resourceName: string;

  @ApiProperty()
  start_date: string;

  @ApiProperty()
  end_date: string;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  title?: string;
}

export class MemoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  resourceId: number;

  @ApiProperty()
  resourceName: string;

  @ApiProperty()
  date?: string;
}
