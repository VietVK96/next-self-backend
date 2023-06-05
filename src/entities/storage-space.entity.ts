import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_STORAGE_SPACE_STS", uniqueConstraints={
 *  @ORM\UniqueConstraint(name="index_group_pack", columns={"GRP_ID","STK_ID"})
 * })
 * @ExclusionPolicy("all")
 */
@Entity('T_STORAGE_SPACE_STS')
export class StorageSpaceEntity {
  /**
   * Identifiant de l'enregistrement.
   *
   * @ORM\Column(name="STS_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @Expose
   * @var integer
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'STS_ID',
  })
  id?: number;

  /**
   * Entité du groupe.
   *
   * @ORM\ManyToOne(targetEntity="GroupEntity")
   * @ORM\JoinColumn(name="GRP_ID", referencedColumnName="GRP_ID")
   * @var \App\Entities\GroupEntity
   */
  // @TODO EntityMissing
  // protected $group;

  /**
   * Entité du pack.
   *
   * @ORM\ManyToOne(targetEntity="StorageSpacePackEntity")
   * @ORM\JoinColumn(name="STK_ID", referencedColumnName="STK_ID")
   * @Expose
   * @var \App\Entities\StorageSpacePackEntity
   */
  // @TODO EntityMissing
  // protected $pack;

  /**
   * Quantité de pack acheté.
   *
   * @ORM\Column(name="STS_QUANTITY", type="integer")
   * @Expose
   * @var integer
   */
  @Column({
    name: 'STS_QUANTITY',
    type: 'int',
    width: 11,
  })
  quantity?: number;

  /** File: application\Entities\Storage\Space.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\Storage\Space\Pack", inversedBy="storageSpace")
   * @ORM\JoinColumn(name="STK_ID", referencedColumnName="STK_ID")
   * @var \App\Entities\Storage\Space\Pack Entité représentant le pack
   * d'espace de stockage.
   */
  // @TODO EntityMissing
  // protected $storageSpacePack;
}

// application\Entities\StorageSpaceEntity.php
// application\Entities\Storage\Space.php
