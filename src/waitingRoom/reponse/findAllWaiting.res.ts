import { ApiProperty } from '@nestjs/swagger';

interface Patient {
  id: number;
  last_name: string;
  first_name: string;
  civility_title: { short_name: string } | null;
}

interface User {
  id: number;
  last_name: string;
  first_name: string;
  short_name: string;
}

export class findAllWaitingRes {
  @ApiProperty()
  id?: number;

  @ApiProperty()
  start?: string;

  @ApiProperty()
  end?: string;

  @ApiProperty()
  color?: number;

  @ApiProperty()
  patient?: Patient;

  @ApiProperty()
  user?: User;
}