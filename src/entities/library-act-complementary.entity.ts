import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LibraryActEntity } from './library-act.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="library_act_complementary")
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('library_act_complementary')
export class LibraryActComplementaryEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   * @ORM\ManyToOne(targetEntity="LibraryAct", inversedBy="complementaries")
   * @ORM\JoinColumn(name="library_act_parent_id", referencedColumnName="id")
   */
  //   protected $parent;
  @Column({
    name: 'library_act_parent_id',
    type: 'int',
    width: 11
  })
  libraryActParentId?: number;
  @ManyToOne(() => LibraryActEntity, e => e.complementaries, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'library_act_parent_id'
  })
  parent?: LibraryActEntity;
  /**
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   * @ORM\ManyToOne(targetEntity="LibraryAct", inversedBy="complementariesWithMe", fetch="EAGER")
   * @ORM\JoinColumn(name="library_act_child_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\MaxDepth(1)
   */
  //   protected $child;
  @Column({
    name: 'library_act_child_id',
    type: 'int',
    width: 11
  })
  libraryActChildId?: number;
  @ManyToOne(() => LibraryActEntity, e => e.complementariesWithMe, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'library_act_child_id'
  })
  child?: LibraryActEntity;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'position',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number = 0;

  /**
   * @ORM\Column(name="used", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'used',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  used?: number = 1;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entities/LibraryActComplementary.php
