import { ApiProperty } from '@nestjs/swagger';

export class UpdateStoragePackDto {
  @ApiProperty()
  storageSpaces?: UpdateStoragePackQuantity[];
}

export class UpdateStoragePackQuantity {
  @ApiProperty()
  quantity?: number;
}
