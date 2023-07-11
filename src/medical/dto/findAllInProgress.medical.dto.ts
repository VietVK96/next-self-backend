import { ApiProperty } from '@nestjs/swagger';

export class FindAllInProgressDto {
  @ApiProperty()
  contactId: number;

  @ApiProperty()
  date: string;
}
