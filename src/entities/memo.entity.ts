import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Memo")
 * @ORM\Table(name="T_MEMO_MEM")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_MEMO_MEM')
export class MemoEntity {
  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="MEM_ID", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "details"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'MEM_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="Resource", fetch="EAGER")
   * @ORM\JoinColumn(name="resource_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "details"})
   * @Serializer\MaxDepth(1)
   * @Assert\NotNull
   */
  // @TODO EntityMissing
  // protected $resource;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User", inversedBy="memos")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @var \App\Entities\User Modèle représentant l'utilisateur.
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\Column(name="MEM_DATE", type="date")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "details"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Type("DateTimeInterface")
   * @Assert\NotNull
   */
  @Column({
    name: 'MEM_DATE',
    type: 'date',
    nullable: true,
  })
  date?: string;

  /**
   * @ORM\Column(name="MEM_MSG", type="text")
   * @Serializer\Expose
   * @Serializer\Groups({"details"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  @Column({
    name: 'MEM_MSG',
    type: 'text',
    nullable: true,
  })
  message?: string;

  /**
   * @ORM\Column(name="MEM_MSG", type="text", nullable=true)
   * @var string Message du commentaire.
   */
  @Column({
    name: 'MEM_MSG',
    type: 'text',
    nullable: true,
  })
  msg?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entities/Memo.php