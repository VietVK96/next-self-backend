import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Storage\Space\Pack")
 * @ORM\Table(name="T_STORAGE_SPACE_PACK_STK")
 */
@Entity('T_STORAGE_SPACE_PACK_STK')
export class StorageSpacePackEntity {
  /**
   * Identifiant de l'enregistrement.
   *
   * @ORM\Column(name="STK_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @Expose
   * @var integer
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'STK_ID',
  })
  id?: number;

  /**
   * @ORM\Column(name="STK_SIZE", type="bigint")
   * @var integer Taille en octet du pack d'espace de stockage.
   */
  @Column({
    name: 'STK_SIZE',
    type: 'bigint',
    width: 20,
  })
  size?: number;

  /**
   * @ORM\Column(name="STK_SIZE_READABLE", type="string", length=45)
   * @var string Taille du pack d'espace de stockage au format
   * chaîne de caractères.
   */
  @Column({
    name: 'STK_SIZE_READABLE',
    type: 'varchar',
    length: 45,
  })
  sizeReadable?: string;

  /**
   * Prix du pack.
   *
   * @ORM\Column(name="STK_PRICE", type="decimal", precision=10, scale=2)
   * @Expose
   * @var float
   */
  @Column({
    name: 'STK_PRICE',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  price?: number;

  /** File: application\Entities\Storage\Space\Pack.php
   * @ORM\OneToMany(targetEntity="\App\Entities\Storage\Space", mappedBy="storageSpacePack")
   * @var \App\Entities\Storage\Space Espace de stockage par groupe.
   */
  // @TODO EntityMissing
  //   protected $storageSpace;
}
// application/Entities/Storage/Space/Pack.php
// application/Entities/StorageSpacePackEntity.php
