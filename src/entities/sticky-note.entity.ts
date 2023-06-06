import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\StickyNoteRepository")
 * @ORM\Table(
 *  name="T_POSTIT_PTT",
 *  indexes={
 *      @ORM\Index(name="INDEX_D3063B009D203F89", columns={"PTT_EDITABLE"})
 *  }
 * )
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('T_POSTIT_PTT')
export class StickyNoteEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="PTT_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"stickyNote:index", "stickyNote:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'PTT_ID',
  })
  id?: number;

  // @TODO EntityMissing
  // @Column({
  //   name: 'CON_ID',
  //   type: 'int',
  //   nullable: true
  // })

  // @TODO EntityMissing
  // @Column({
  //   name: 'USR_ID',
  //   type: 'int',
  //   nullable: true
  // })

  /**
   * @ORM\Column(name="PTT_MSG", type="text")
   * @Serializer\Expose
   * @Serializer\Groups({"stickyNote:index", "stickyNote:read"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  @Column({
    name: 'PTT_MSG',
    type: 'text',
    nullable: true
  })
  content?: string;

  @Column({
    name: 'PTT_COLOR',
    type: 'int',
    width: 11,
    nullable: false,
    default: -41487
  })
  color?: number;

  /**
   * @ORM\Column(name="PTT_EDITABLE", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"stickyNote:index", "stickyNote:read"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'PTT_EDITABLE',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1
  })
  editable?: number;

  @Column({
    name: 'PTT_SHARED',
    type: 'tinyint',
    width: 1,
    nullable: false,
    default: 1
  })
  shared?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entity/StickyNote.php