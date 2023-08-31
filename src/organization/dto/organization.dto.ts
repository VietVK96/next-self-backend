import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionsPlanUpdateDto {
  @ApiProperty({
    required: false,
  })
  plans?: number[];
}
