import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { LibraryActEntity } from './library-act.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="library_act_association")
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('library_act_association')
export class LibraryActAssociationEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   * @ORM\ManyToOne(targetEntity="LibraryAct", inversedBy="associations")
   * @ORM\JoinColumn(name="library_act_parent_id", referencedColumnName="id")
   */
  //   protected $parent;
  @PrimaryColumn({
    name: 'library_act_parent_id',
    type: 'int',
    width: 11
  })
  libraryActParentId?: number;
  @ManyToOne(() => LibraryActEntity, e => e.associations , {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'library_act_parent_id'
  })
  parent?: LibraryActEntity;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   * @ORM\ManyToOne(targetEntity="LibraryAct", inversedBy="associatedWithMe", fetch="EAGER")
   * @ORM\JoinColumn(name="library_act_child_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\MaxDepth(1)
   */
  //   protected $child;
  @PrimaryColumn({
    name: 'library_act_child_id',
    type: 'int',
    width: 11
  })
  libraryActChildId?: number;
  @ManyToOne(() => LibraryActEntity, e => e.associatedWithMe, {
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
   * @ORM\Column(name="automatic", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'automatic',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  automatic?: number = 1;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entities/LibraryActAssociation.php
