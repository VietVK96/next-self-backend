import { ApiProperty } from '@nestjs/swagger';

export class CheckHBJDCCcamCodeDto {
  @ApiProperty()
  date?: string;
}

export class CheckHBQKCcamCodeDto {
  @ApiProperty()
  teeth?: string;
  @ApiProperty()
  date?: string;
}

export class CheckHBMDCcamCodeDto {
  @ApiProperty()
  teeth?: string;
  @ApiProperty()
  date?: string;
}
