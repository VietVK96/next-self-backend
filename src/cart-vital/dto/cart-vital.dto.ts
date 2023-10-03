import { ApiProperty } from '@nestjs/swagger';

export class ReadCardVitalDto {
  @ApiProperty()
  external_reference_id?: number;
}

export class SaveCardVitalDto {
  @ApiProperty()
  external_reference_id?: number;

  @ApiProperty()
  user_id?: number;

  @ApiProperty()
  id?: number;
}

export class SyncFsvDto {
  @ApiProperty()
  patient_id?: number;

  @ApiProperty()
  user_id?: number;
}

export class UpdateFSVDto {
  @ApiProperty()
  idPatient?: number;
}
