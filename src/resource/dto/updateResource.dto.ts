import { ApiProperty } from '@nestjs/swagger';

export class UpdateResourceDto {
  @ApiProperty({
    required: true,
  })
  id?: number;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  color?: string;

  @ApiProperty()
  listAssistante: string[];
}
