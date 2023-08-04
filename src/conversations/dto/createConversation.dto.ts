import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDTO {
  @ApiProperty()
  title: string;

  @ApiProperty()
  users?: Array<number>;
}
