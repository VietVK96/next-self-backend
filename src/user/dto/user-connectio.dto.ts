import { ApiProperty } from '@nestjs/swagger';
import { UserConnectionEntity } from 'src/entities/user-connection.entity';

export class UserConnectionDto {
  @ApiProperty()
  connections: UserConnectionEntity[];
  @ApiProperty()
  pagination: {
    page: number;
    pagesCount: number;
  };
}
