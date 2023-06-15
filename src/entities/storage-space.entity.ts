import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { StorageSpacePackEntity } from './storage-space-pack.entity';

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
   * @ORM\Column(name="STS_QUANTITY", type="integer")
   * @var integer Quantité d'espace de stockage.
   */
  @Column({
    name: 'STS_QUANTITY',
    type: 'int',
    width: 11,
  })
  quantity?: number;

  /** File: application\Entities\Storage\Space.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\Group")
   * @ORM\JoinColumn(name="GRP_ID", referencedColumnName="GRP_ID")
   * @var \App\Entities\Group Entité représentant le groupe.
   */
  /** File : application\Entities\StorageSpaceEntity.php
   * Entité du groupe.
   *
   * @ORM\ManyToOne(targetEntity="GroupEntity")
   * @ORM\JoinColumn(name="GRP_ID", referencedColumnName="GRP_ID")
   * @var \App\Entities\GroupEntity
   */
  // protected $group;
  @Column({
    name: 'GRP_ID',
    type: 'int',
    width: 11,
  })
  grpId?: number;
  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'GRP_ID',
  })
  group?: OrganizationEntity;

  /** File: application\Entities\Storage\Space.php
   * @ORM\ManyToOne(targetEntity="\App\Entities\Storage\Space\Pack", inversedBy="storageSpace")
   * @ORM\JoinColumn(name="STK_ID", referencedColumnName="STK_ID")
   * @var \App\Entities\Storage\Space\Pack Entité représentant le pack
   * d'espace de stockage.
   */
  // protected $storageSpacePack;
  @Column({
    name: 'STK_ID',
    type: 'int',
    width: 11,
  })
  stkId?: number;
  @ManyToOne(() => StorageSpacePackEntity, (e) => e.storageSpace, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'STK_ID',
  })
  storageSpacePack?: StorageSpacePackEntity;

  /** File: application\Entities\StorageSpaceEntity.php
   * Entité du pack.
   *
   * @ORM\ManyToOne(targetEntity="StorageSpacePackEntity")
   * @ORM\JoinColumn(name="STK_ID", referencedColumnName="STK_ID")
   * @Expose
   * @var \App\Entities\StorageSpacePackEntity
   */
  // protected $pack;
  @ManyToOne(() => StorageSpacePackEntity, (e) => e.storageSpace, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'STK_ID',
  })
  pack?: StorageSpacePackEntity;
}
// application/Entities/StorageSpaceEntity.php
// application/Entities/Storage/Space.php
