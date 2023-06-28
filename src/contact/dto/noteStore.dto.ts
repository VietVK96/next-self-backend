import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class StoreNoteDto {
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

  @ApiProperty({
    name: 'conId',
    required: true,
  })
  conId: number;
}
