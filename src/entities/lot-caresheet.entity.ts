import { Entity, PrimaryColumn } from 'typeorm';

@Entity('lot_caresheet')
export class LotCareSheetEntity {
  @PrimaryColumn({
    name: 'lot_id',
    type: 'int',
  })
  lotId?: number;

  @PrimaryColumn({
    name: 'caresheet_id',
    type: 'int',
  })
  caresheetId?: number;
}
