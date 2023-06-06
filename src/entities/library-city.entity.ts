import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_LIBRARY_CITY_LCI")
 */
@Entity('T_LIBRARY_CITY_LCI')
export class LibraryCityEntity {
  /**
   * @ORM\Column(name="LCI_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'LCI_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="LCI_NAME", type="string", length=250)
   */
  @Column({
    name: 'LCI_NAME',
    length: 250,
    type: 'varchar',
  })
  name?: string;

  /**
   * @ORM\Column(name="LCI_ZIP_CODE", type="string", length=250)
   */
  @Column({
    name: 'LCI_ZIP_CODE',
    length: 250,
    type: 'varchar',
  })
  zipCode?: string;

  /**
   * @ORM\Column(name="LCI_COUNTRY", type="string", length=250)
   */
  @Column({
    name: 'LCI_COUNTRY',
    length: 250,
    type: 'varchar',
  })
  country?: string;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Group")
   * @ORM\JoinColumn(name="GRP_ID", referencedColumnName="GRP_ID")
   * @var \App\Entities\Group|NULL
   */
  // @TODO EntityMissing
  //protected $group;

  /**
   * Initialisation des propriétés du modèle.
   */
}
