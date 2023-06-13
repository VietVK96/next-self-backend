import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationEntity } from './conversation.entity';
import { UserEntity } from './user.entity';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\ConversationMessageRepository")
 * @ORM\Table(name="conversation_message")
 * @ORM\HasLifecycleCallbacks
 * @ExclusionPolicy("all")
 */
@Entity('conversation_message')
export class ConversationMessageEntity {
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
  // protected $conversation;

  @Column({
    name: 'conversation_id',
    type: 'int',
    width: 11,
  })
  conversationId: number;

  @ManyToOne(() => ConversationEntity, (e) => e.messages, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'conversation_id',
    referencedColumnName: 'id',
  })
  conversation: ConversationEntity;

  /**
   * Entité de l'utilisateur.
   *
   * @ORM\ManyToOne(targetEntity="UserEntity")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @Expose
   * @var \App\Entities\UserEntity
   */
  // protected $user;

  @Column({
    name: 'user_id',
    type: 'int',
    width: 11,
  })
  userId: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'USR_ID',
  })
  user: UserEntity;

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
