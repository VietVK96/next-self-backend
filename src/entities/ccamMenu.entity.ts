import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repository\CcamMenuRepository")
 * @ORM\Table(
 *  name="ccam_menu",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="UNIQ_A22AE8D74C1BA9B6", columns={"paragraphe"})
 *  }
 * )
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('ccam_menu')
export class CcamMenuEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"ccamMenu:index", "ccamMenu:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="CcamMenu")
   * @ORM\JoinColumn(name="parent_id", referencedColumnName="id", nullable=true)
   */
  //   protected $parent = null;
  @Column({
    name: 'parent_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  parentId?: number;

  @ManyToOne(() => CcamMenuEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'parent_id',
  })
  parent?: CcamMenuEntity;

  /**
   * @ORM\Column(name="rang", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"ccamMenu:index", "ccamMenu:read"})
   * @Serializer\Type("int")
   */
  @Column({
    name: 'rang',
    type: 'int',
    width: 11,
  })
  rang?: number;

  /**
   * @ORM\Column(name="libelle", type="string", length=254)
   * @Serializer\Expose
   * @Serializer\Groups({"ccamMenu:index", "ccamMenu:read"})
   * @Serializer\Type("int")
   */
  @Column({
    name: 'libelle',
    type: 'varchar',
    length: 254,
  })
  libelle?: string;

  /**
   * @ORM\Column(name="paragraphe", type="string", length=11, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"ccamMenu:index", "ccamMenu:read"})
   * @Serializer\Type("int")
   */
  @Column({
    name: 'paragraphe',
    type: 'varchar',
    length: 11,
    nullable: true,
  })
  paragraphe?: string;
}

//application\Entity\CcamMenu.php