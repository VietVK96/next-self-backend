import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\ConversationRepository")
 * @ORM\Table(name="conversation")
 * @ORM\HasLifecycleCallbacks
 * @ExclusionPolicy("all")
 */
@Entity('conversation')
export class ConversationEntityEntity {

  /**
   * Identifiant de l'enregistrement.
   * 
   * @ORM\Column(name="id", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @Expose
   * @var integer
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id'
  })
  id?: number;

  /**
   * Entité de l'utilisateur.
   * 
   * @ORM\ManyToOne(targetEntity="UserEntity")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @Expose
   * @var \App\Entities\UserEntity
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   */
  // @TODO EntityMissing
  // protected $owner;

  /**
   * Titre de la conversation.
   * 
   * @ORM\Column(name="title", type="string", length=255)
   * @Expose
   * @var string
   */
  @Column({
    name: 'title',
    type: 'string',
    length: 255,
    nullable: false
  })
  title?: string;

  /**
   * Nombre de messages dans la conversation.
   * 
   * @ORM\Column(name="message_count", type="integer")
   * @Expose
   * @var integer
   */
  @Column({
    name: 'message_count',
    type: 'int',
    nullable: false,
    default: 0
  })
  messageCount?: number;

  /**
   * Membres de la conversation.
   * 
   * @ORM\OneToMany(targetEntity="ConversationMemberEntity", mappedBy="conversation", cascade={"persist", "remove"})
   * @Expose
   * @var \Doctrine\Common\Collections\ArrayCollection
   */
  // @TODO EntityMissing
  // protected $members;

  /**
   * Messages de la conversation.
   * 
   * @ORM\OneToMany(targetEntity="ConversationMessageEntity", mappedBy="conversation", cascade={"persist","remove"})
   * @Expose
   * @var \Doctrine\Common\Collections\ArrayCollection
   */
  // @TODO EntityMissing
  // protected $messages;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entities/ConversationEntity.php