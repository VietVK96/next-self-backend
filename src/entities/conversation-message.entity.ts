import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\ConversationMessageRepository")
 * @ORM\Table(name="conversation_message")
 * @ORM\HasLifecycleCallbacks
 * @ExclusionPolicy("all")
 */
@Entity('conversation_message')
export class ConversationMessageEntityEntity {
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
    name: 'id',
  })
  id?: number;

  /**
   * Entité de la conversation.
   *
   * @ORM\ManyToOne(targetEntity="ConversationEntity", inversedBy="messages")
   * @ORM\JoinColumn(name="conversation_id", referencedColumnName="id")
   * @var \App\Entities\ConversationEntity
   */
  // @TODO EntityMissing
  // protected $conversation;

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
   * Corps du message.
   *
   * @ORM\Column(name="body", type="text")
   * @Expose
   * @var string
   */
  @Column({
    name: 'body',
    type: 'text',
    nullable: false,
  })
  body?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entities/ConversationMessageEntity.php
