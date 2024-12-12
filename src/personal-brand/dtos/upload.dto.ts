import { ApiProperty } from '@nestjs/swagger';

export class UpdateInfoBodyDto {
  @ApiProperty({
    required: false,
  })
  branchName?: string;

  @ApiProperty({
    required: false,
  })
  job?: string;

  @ApiProperty({
    required: false,
  })
  questions?: string;
}
