import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ContactEntity } from './contact.entity';
import { UploadEntity } from './upload.entity';

export enum EnumContactDocumentType {
  FILE = 'file',
  RX = 'rx',
}
/**
 * @ORM\Entity
 * @ORM\Table(name="T_CONTACT_DOCUMENT_COD")
 */
@Entity('T_CONTACT_DOCUMENT_COD')
export class ContactDocumentEntity {
  /**
   * @ORM\Column(name="COD_TYPE", type="string", nullable=false)
   */
  @Column({
    name: 'COD_TYPE',
    type: 'enum',
    enum: EnumContactDocumentType,
  })
  type?: EnumContactDocumentType;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   */
  //   protected $contact;
  @Column({
    name: 'CON_ID',
    type: 'int',
    width: 11,
  })
  conId?: number;

  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false,
  })
  contact?: ContactEntity;
  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Upload")
   * @ORM\JoinColumn(name="UPL_ID", referencedColumnName="UPL_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   */
  //   protected $upload;
  @Column({
    name: 'UPL_ID',
    type: 'int',
    width: 11,
  })
  uplId?: number;

  @ManyToOne(() => UploadEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'UPL_ID',
  })
  upload?: UploadEntity;
}
// application/Entities/Contact/Document.php
