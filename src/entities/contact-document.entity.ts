import { Column, Entity } from 'typeorm';

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
  // @TODO EntityMissing
  //   protected $contact;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Upload")
   * @ORM\JoinColumn(name="UPL_ID", referencedColumnName="UPL_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   */
  // @TODO EntityMissing
  //   protected $upload;
}
// application/Entities/Contact/Document.php
