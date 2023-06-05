import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum EnumEventType {
  EVENT = 'event',
  ABSENCE = 'absence',
}

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Event")
 * @ORM\Table(name="T_EVENT_EVT")
 * @ORM\HasLifecycleCallbacks
 */
@Entity('T_EVENT_EVT')
export class EventEntity {

  /**
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   * @ORM\Column(name="EVT_ID", type="integer")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'EVT_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Resource")
   * @ORM\JoinColumn(name="resource_id", referencedColumnName="id")
   * @var \App\Entities\Resource Entité représentant une ressource.
   */
  // @TODO EntityMissing
  // protected $resource;

  /**
   * @ORM\Column(name="EVT_TYPE", type="string", nullable=false)
   */
  @Column({
    name: 'EVT_TYPE',
    type: 'enum',
    enum: EnumEventType,
    default: EnumEventType.EVENT,
  })
  type?: EnumEventType;

  /**
   * @ORM\Column(name="EVT_NAME", type="string", length=81, nullable=false)
   */
  @Column({
    name: 'EVT_NAME',
    type: 'varchar',
    length: 81,
    nullable: true,
    default: null
  })
  name?: string;

  /**
   * @ORM\Column(name="EVT_START", type="datetime", nullable=true)
   */
  @Column({
    name: 'EVT_START',
    type: 'datetime',
    nullable: true,
    default: null
  })
  start?: string;

  /**
   * @ORM\Column(name="EVT_START_TZ", type="string", length=45, nullable=false)
   */
  @Column({
    name: 'EVT_START_TZ',
    type: 'varchar',
    length: 45,
    default: 'UTC'
  })
  startTimezone?: string;

  /**
   * @ORM\Column(name="EVT_END", type="datetime", nullable=true)
   */
  @Column({
    name: 'EVT_END',
    type: 'datetime',
    nullable: true,
    default: null
  })
  end?: string;

  /**
   * @ORM\Column(name="EVT_END_TZ", type="string", length=45, nullable=false)
   */
  @Column({
    name: 'EVT_END_TZ',
    type: 'varchar',
    length: 45,
    default: 'UTC'
  })
  endTimezone?: string;

  /**
   * @ORM\Column(name="EVT_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'EVT_MSG',
    type: 'text',
    nullable: true,
    default: null,
  })
  msg?: string;

  /**
   * @ORM\Column(name="EVT_PRIVATE", type="integer")
   * @var boolean $private
   */
  @Column({
    name: 'EVT_PRIVATE',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  private?: number;

  /**
   * @ORM\Column(name="EVT_COLOR", type="integer", nullable=false)
   */
  @Column({
    name: 'EVT_COLOR',
    type: 'int',
    width: 11,
    default: -12303,
  })
  color?: number;

  /**
   * @ORM\Column(name="EVT_STATE", type="integer", nullable=false)
   */
  @Column({
    name: 'EVT_STATE',
    type: 'int',
    width: 11,
    default: 0,
  })
  state?: number;

  /**
   * @ORM\Column(name="lateness", type="integer")
   */
  @Column({
    name: 'lateness',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  lateness?: number;

  // Missing from entity php
  // evt_rrule?: string;

  /**
   * @ORM\Column(name="EVT_SOLICITATION", type="integer", nullable=false)
   */
  @Column({
    name: 'EVT_SOLICITATION',
    type: 'int',
    width: 11,
    default: 0,
  })
  solicitation?: number;

  /**
   * @ORM\Column(name="EVT_DELETE", type="integer")
   * @var boolean $delete
   */
  @Column({
    name: 'EVT_DELETE',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  delete?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User", inversedBy="events")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="events")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   */
  // @TODO EntityMissing
  // protected $contact;

  /**
     * @ORM\ManyToOne(targetEntity="EventType")
     * @ORM\JoinColumn(name="event_type_id", referencedColumnName="id")
     * @Serializer\Expose
     * @Serializer\Groups({
     *  "event:read"
     * })
     */
  // @TODO EntityMissing
  // protected $reason = null;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Event\Task", mappedBy="event")
   */
  // @TODO EntityMissing
  // protected $tasks;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Event\Historical", mappedBy="event")
   * @ORM\OrderBy({"id" = "DESC"})
   */
  // @TODO EntityMissing
  // protected $historical;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Reminder", mappedBy="event")
   */
  // @TODO EntityMissing
  // protected $reminders;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Plan\Event", mappedBy="event")
   */
  // @TODO EntityMissing
  // protected $planEvent;

  // Missing from entity php
  // created_by: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

// application/Entities/Event.php
