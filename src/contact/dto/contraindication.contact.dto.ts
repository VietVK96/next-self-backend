import { ApiProperty } from '@nestjs/swagger';

export class SaveContraindicationDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id: number;

  @ApiProperty({
    name: 'msg',
    required: true,
  })
  msg: string;

  @ApiProperty({
    name: 'contraindications',
    required: false,
  })
  contraindications?: number[];
}
