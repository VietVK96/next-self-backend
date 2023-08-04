import { ApiProperty } from '@nestjs/swagger';

class OutgoingServerDto {
  @ApiProperty()
  username?: string;

  @ApiProperty()
  password?: string;

  @ApiProperty()
  hostname?: string;

  @ApiProperty()
  port?: number;
}

export class SaveEmailDto {
  @ApiProperty()
  emailAddress?: string;

  @ApiProperty()
  displayName?: string;

  @ApiProperty()
  replyToAddress?: string;

  @ApiProperty()
  subscribers?: number[];

  @ApiProperty()
  outgoingServer?: OutgoingServerDto;
}
