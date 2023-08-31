import { ApiProperty } from '@nestjs/swagger';

export class UpdateStoragePackDto {
  @ApiProperty()
  storageSpaces?: UpdateStoragePackQuantity[];
}

export class UpdateStoragePackQuantity {
  @ApiProperty()
  quantity?: number;
}

export class UsersStorageDto {
  @ApiProperty()
  confirm: string;

  @ApiProperty()
  quantities: number[];
}
