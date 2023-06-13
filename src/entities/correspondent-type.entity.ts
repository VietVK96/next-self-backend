import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrganizationEntity } from "./organization.entity";
import { CorrespondentEntity } from "./correspondent.entity";

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
  // protected $group;
  @Column({
    name: 'group_id'
  })
  groupId?: string;

  @ManyToOne(() => OrganizationEntity, e => e.CorrespondentTypes, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'group_id',
    referencedColumnName: 'GRP_ID'
  })
  group?: OrganizationEntity;

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
