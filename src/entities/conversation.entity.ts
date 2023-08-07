import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ConversationMemberEntity } from './conversation-member.entity';
import { ConversationMessageEntity } from './conversation-message.entity';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\ConversationRepository")
 * @ORM\Table(name="conversation")
 * @ORM\HasLifecycleCallbacks
 * @ExclusionPolicy("all")
 */
@Entity('conversation')
export class ConversationEntity {
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
   * Entité de l'utilisateur.
   *
   * @ORM\ManyToOne(targetEntity="UserEntity")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   * @Expose
   * @var \App\Entities\UserEntity
   */
  //
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
   * @ORM\ManyToOne(targetEntity="User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   */
  //
  // protected $owner;
  // @Column({
  //   name: 'user_id',
  //   type: 'int',
  //   width: 11,
  //   nullable: true,
  // })

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'user_id',
  })
  owner?: UserEntity;
  /**
   * Titre de la conversation.
   *
   * @ORM\Column(name="title", type="string", length=255)
   * @Expose
   * @var string
   */
  @Column({
    name: 'title',
    type: 'varchar',
    length: 255,
    nullable: false,
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
    default: 0,
  })
  messageCount?: number;

  /**
   * Membres de la conversation.
   *
   * @ORM\OneToMany(targetEntity="ConversationMemberEntity", mappedBy="conversation", cascade={"persist", "remove"})
   * @Expose
   * @var \Doctrine\Common\Collections\ArrayCollection
   */
  // protected $members;

  @OneToMany(() => ConversationMemberEntity, (e) => e.conversation, {
    createForeignKeyConstraints: false,
    cascade: ['insert', 'remove'],
  })
  members?: ConversationMemberEntity[];

  /**
   * Messages de la conversation.
   *
   * @ORM\OneToMany(targetEntity="ConversationMessageEntity", mappedBy="conversation", cascade={"persist","remove"})
   * @Expose
   * @var \Doctrine\Common\Collections\ArrayCollection
   */
  // protected $messages;
  @OneToMany(() => ConversationMessageEntity, (e) => e.conversation, {
    createForeignKeyConstraints: false,
  })
  messages?: ConversationMessageEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
}

//application/Entities/ConversationEntity.php
