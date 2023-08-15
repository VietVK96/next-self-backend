import { ApiProperty } from '@nestjs/swagger';

export class CheckHBJDCCcamCodeRes {
  @ApiProperty()
  confirm?: boolean;
  @ApiProperty()
  sameDate?: boolean;
  @ApiProperty()
  nonRefundable?: boolean;
}
