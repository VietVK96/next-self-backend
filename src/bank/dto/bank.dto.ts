import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class BankCheckPrintDto {
  @ApiProperty({
    name: 'id',
    required: true,
  })
  id?: number;
  @ApiProperty({
    name: 'doctor_id',
    required: true,
  })
  doctor_id?: number;

  @ApiProperty({
    name: 'amount',
    required: true,
  })
  amount?: number;
}
