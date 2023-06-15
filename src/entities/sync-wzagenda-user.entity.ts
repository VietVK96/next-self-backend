import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

/**
 * @ORM\Entity
 * @ORM\Table(name="T_SYNC_WZAGENDA_USER_SWU")
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
@Entity('T_SYNC_WZAGENDA_USER_SWU')
export class SyncWzagendaUserEntity {
  @PrimaryColumn({
    name: 'USR_ID',
    type: 'int',
  })
  id?: number;

  /**
   * @ORM\Column(name="SWU_CALENDAR_ID", type="string", length=32)
   * @var string Identifiant souscripteur permettant l'authentification
   * de l'agenda WzAgenda.
   */
  @Column({
    name: 'SWU_CALENDAR_ID',
    type: 'varchar',
    length: 32,
  })
  calendarId?: string;

  /**
   * @ORM\Column(name="SWU_LAST_MODIFIED", type="datetime", nullable=true)
   * @var \DateTime|NULL Date maximale de dernière modification des rendez-vous.
   */
  @Column({
    name: 'SWU_LAST_MODIFIED',
    type: 'datetime',
    nullable: true,
  })
  lastModified?: string;

  /**
   * @ORM\Column(name="SWU_LAST_MODIFIED_WZAGENDA", type="integer", nullable=true)
   * @var integer Date maximale de dernière modification des rendez-vous WzAgenda.
   */
  @Column({
    name: 'SWU_LAST_MODIFIED_WZAGENDA',
    type: 'int',
    width: 11,
    nullable: true,
  })
  lastModifiedWzAgenda?: number;

  /**
   * @ORM\Column(name="SWU_MESSAGE_REQUEST_BEGIN", type="datetime", nullable=true)
   * @var \DateTime Date de début de recherche des messages.
   */
  @Column({
    name: 'SWU_MESSAGE_REQUEST_BEGIN',
    type: 'datetime',
    nullable: true,
  })
  messageRequestBegin?: string;

  /**
   * @ORM\Column(name="SWU_MESSAGE_REQUEST_BEGIN_EXTERNAL", type="datetime", nullable=true)
   * @var \DateTime Date de début de recherche des messages dans l'application externe.
   */
  @Column({
    name: 'SWU_MESSAGE_REQUEST_BEGIN_EXTERNAL',
    type: 'datetime',
    nullable: true,
  })
  messageRequestBeginExternal?: string;

  /**
   * @ORM\Column(name="SWU_ACTIVATED_ON", type="datetime")
   * @var \DateTime|NULL Date d'activation de la synchronisation.
   */
  @Column({
    name: 'SWU_ACTIVATED_ON',
    type: 'datetime',
  })
  activatedOn?: string;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="NONE")
   * @var \App\Entities\User Entité représentant l'utilisateur
   * ayant activé la synchronisation avec WzAgenda.
   */
  // protected $user;
  @OneToOne(() => UserEntity, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'USR_ID' })
  user?: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entities/Sync/WzAgenda/User.php
