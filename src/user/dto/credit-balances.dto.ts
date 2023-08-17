import { ApiProperty } from '@nestjs/swagger';

export class CreditBalancesDto {
  @ApiProperty({ example: 1 })
  id?: number;

  @ApiProperty({ example: 1 })
  page?: number;

  @ApiProperty({ example: 25 })
  per_page?: number;

  @ApiProperty({ required: false, example: 'desc' })
  direction?: string;

  @ApiProperty({ required: false, example: 'patientBalance.visitDate' })
  sort?: string;

  @ApiProperty({ isArray: true, type: String, required: false })
  filterParams?: string[];

  @ApiProperty({ isArray: true, type: String, required: false })
  filterValues?: string[];
}
