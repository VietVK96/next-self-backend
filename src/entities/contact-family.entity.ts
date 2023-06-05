import { Entity, PrimaryGeneratedColumn } from 'typeorm';

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
  // @TODO EntityMissing
  // @TODO VariableMissing
  //   protected $contacts;

  /**
   * @ORM\OneToMany(targetEntity="PatientEntity", mappedBy="family")
   * @Expose
   */
  // @TODO EntityMissing
  // @TODO VariableMissing
  //   protected $patients;
}
// application/Entities/Contact/Family.php
// application/Entities/PatientFamilyEntity.php
