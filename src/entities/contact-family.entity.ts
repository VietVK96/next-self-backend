import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ContactEntity } from './contact.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_CONTACT_FAMILY_COF")
 */
@Entity('T_CONTACT_FAMILY_COF')
export class ContactFamilyEntity {
  /**
   * @ORM\Column(name="COF_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'COF_ID',
  })
  id?: number;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Contact", mappedBy="family")
   */
  //   protected $contacts;
  @OneToMany(() => ContactEntity, (e) => e.family, {
    createForeignKeyConstraints: false,
  })
  contacts?: ContactEntity[];
  /**
   * @ORM\OneToMany(targetEntity="PatientEntity", mappedBy="family")
   * @Expose
   */
  //   protected $patients;
  @OneToMany(() => ContactEntity, (e) => e.family, {
    createForeignKeyConstraints: false,
  })
  patients?: ContactEntity[];
}
// application/Entities/Contact/Family.php
// application/Entities/PatientFamilyEntity.php
