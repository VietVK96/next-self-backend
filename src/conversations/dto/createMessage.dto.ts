import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDTO {
  @ApiProperty()
  conversationId?: number;

  @ApiProperty()
  body?: string;
}
