import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  message: string;
}
