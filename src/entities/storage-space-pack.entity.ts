import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity
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
   * Taille du pack en octet.
   *
   * @ORM\Column(name="STK_SIZE", type="bigint")
   * @Expose
   * @var string
   */
  @Column({
    name: 'STK_SIZE',
    type: 'bigint',
    width: 20,
  })
  size?: number;

  /**
   * Taille du pack sous forme de chaîne de caractères.
   *
   * @ORM\Column(name="STK_SIZE_READABLE", type="string", length=45)
   * @Expose
   * @var string
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
  // protected $storageSpace;
}

// application\Entities\StorageSpacePackEntity.php
// application\Entities\Storage\Space\Pack.php
