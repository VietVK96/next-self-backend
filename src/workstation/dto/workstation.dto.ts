import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkstationDto {
  @ApiProperty()
  name: string;
}
