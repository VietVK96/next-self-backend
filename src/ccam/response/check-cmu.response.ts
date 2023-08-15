import { ApiProperty } from '@nestjs/swagger';
import { CcamCmuCodificationEntity } from 'src/entities/ccam-cmu-codification.entity';

export class CheckCmuResponse {
  @ApiProperty()
  is_cmu: boolean;

  @ApiProperty()
  cmu_codification?: CcamCmuCodificationEntity;
}
