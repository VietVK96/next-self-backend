import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkstationDto {
  @ApiProperty()
  name: string;
  @ApiProperty()
  platform?: number;
}
