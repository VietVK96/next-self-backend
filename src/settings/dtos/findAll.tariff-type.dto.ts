import { ApiProperty } from '@nestjs/swagger';

export class FindAllTariffTypesDto {
  @ApiProperty()
  organizationId?: number;
}
