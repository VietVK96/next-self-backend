import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConversationEntity } from './conversation.entity';
import { UserEntity } from './user.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="conversation_member",
 *  uniqueConstraints={
 *      @ORM\UniqueConstraint(name="idx_conversation_user", columns={"conversation","user"})
 *  }
 * )
 * @ExclusionPolicy("all")
 */
@Entity('conversation_member')
export class ConversationMemberEntity {
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
   * @ORM\ManyToOne(targetEntity="ConversationEntity", inversedBy="members")
   * @ORM\JoinColumn(name="conversation_id", referencedColumnName="id")
   * @var \App\Entities\ConversationEntity
   */
  // protected $conversation;
  @Column({
    name: 'conversation_id',
    type: 'int',
    width: 11,
  })
  conversationId?: number;

  @ManyToOne(() => ConversationEntity, (e) => e.members, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'conversation_id',
  })
  conversation?: ConversationEntity;

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
  userId?: number;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
  })
  user?: UserEntity;

  /**
   * Date et heure de lecture de la conversation.
   *
   * @ORM\Column(name="read_at", type="datetime", nullable=true)
   * @Expose
   * @var DateTime
   */
  @Column({
    name: 'read_at',
    type: 'datetime',
    nullable: true,
  })
  readAt?: string;
}

//application/Entities/ConversationMemberEntity.php
