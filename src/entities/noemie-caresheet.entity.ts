import { Entity, PrimaryColumn } from 'typeorm';

@Entity('noemie_caresheet')
export class NoemioCaresheetEntity {
  @PrimaryColumn({
    name: 'noemie_id',
    type: 'int',
  })
  noemieId?: number;

  @PrimaryColumn({
    name: 'caresheet_id',
    type: 'int',
  })
  caresheetId?: number;
}
