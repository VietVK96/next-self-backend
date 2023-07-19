import { Entity, PrimaryColumn } from 'typeorm';

@Entity('T_CORRESPONDENT_PHONE_CPP')
export class CorrespondentPhoneCppEntity {
  @PrimaryColumn({
    name: 'PHO_ID',
    type: 'int',
  })
  phoId?: number;

  @PrimaryColumn({
    name: 'CPD_ID',
    type: 'int',
  })
  cpdId?: number;
}
