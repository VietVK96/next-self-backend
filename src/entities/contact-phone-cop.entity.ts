import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('T_CONTACT_PHONE_COP')
export class ContactPhoneCopEntity {
  @PrimaryColumn({
    type: 'int',
    width: 11,
    name: 'PHO_ID',
  })
  id?: number;

  @Column({
    type: 'int',
    width: 11,
    name: 'CON_ID',
  })
  conId?: number;
}
