import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @ORM\Entity
 * @ORM\Table(name="correspondent_type")
 */
@Entity('correspondent_type')
export class CorrespondentTypeEntity {

  /**
   * @ORM\Column(name="id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @var integer Identifiant de l'enregistrement.
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Group")
   * @ORM\JoinColumn(name="group_id", referencedColumnName="GRP_ID")
   * @var \App\Entities\Group Entité représentant le groupe.
   */
  // @TODO EntityMissing
  // protected $group;

  /**
   * @ORM\Column(name="name", type="string", length=255)
   * @var string Nom du type de correspondant.
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
  })
  name?: string;

}

// application/Entities/CorrespondentType.php
// application/Entity/AddressBookCategory.php
