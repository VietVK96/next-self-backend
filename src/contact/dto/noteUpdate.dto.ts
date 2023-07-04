import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class UpdateNoteDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;

  @ApiProperty({
    name: 'date',
    required: true,
  })
  date?: string;

  @ApiProperty({
    name: 'color',
    required: true,
  })
  color: number;

  @ApiProperty({
    name: 'message',
    required: true,
  })
  message: string;

  @ApiProperty({
    name: 'userId',
    required: true,
  })
  userId: number;
}
