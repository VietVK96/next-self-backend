import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ResourceEntity } from "./resource.entity";
import { UserEntity } from "./user.entity";
import { ContactEntity } from "./contact.entity";
import { EventTypeEntity } from "./event-type.entity";
import { EventTaskEntity } from "./event-task.entity";
import { EventHistoricalEntity } from "./event-historical.entity";
import { ReminderEntity } from "./reminder.entity";
import { PlanEventEntity } from "./plan-event.entity";

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
  // protected $resource;
  @Column({
    name: 'resource_id',
    type: 'int',
    width: 11,
    nullable: true
  })
  resourceId?: number;
  @ManyToOne(() => ResourceEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'resource_id',
  })
  resource?: ResourceEntity;

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
  })
  name?: string;

  /**
   * @ORM\Column(name="EVT_START", type="datetime", nullable=true)
   */
  @Column({
    name: 'EVT_START',
    type: 'datetime',
    nullable: true,
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
  // protected $user;
  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
    nullable: true
  })
  usrId?: number;
  @ManyToOne(() => UserEntity, (e) => e.events, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  user?: UserEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact", inversedBy="events")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   */
  // protected $contact;
  @Column({
    name: 'CON_ID',
    type: 'int',
    width: 11,
    nullable: true
  })
  conId?: number;
  @ManyToOne(() => ContactEntity, (e) => e.events, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  contact?: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "event:read"
   * })
   */
  // protected $patient = null;
  @ManyToOne(() => ContactEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  patient?: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="EventType")
   * @ORM\JoinColumn(name="event_type_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({
   *  "event:read"
   * })
   */
  // protected $reason = null;
  @Column({
    name: 'event_type_id',
    type: 'int',
    width: 11,
    nullable: true
  })
  eventTypeId?: number;
  @ManyToOne(() => EventTypeEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'event_type_id',
  })
  reason?: EventTypeEntity;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Event\Task", mappedBy="event")
   */
  // protected $tasks;
  @OneToMany(() => EventTaskEntity, (e) => e.event, {
    createForeignKeyConstraints: false
  })
  tasks?: EventTaskEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Event\Historical", mappedBy="event")
   * @ORM\OrderBy({"id" = "DESC"})
   */
  // protected $historical;
  @OneToMany(() => EventHistoricalEntity, (e) => e.event, {
    createForeignKeyConstraints: false
  })
  historical?: EventHistoricalEntity[];

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Reminder", mappedBy="event")
   */
  // protected $reminders;
  @OneToMany(() => ReminderEntity, (e) => e.event, {
    createForeignKeyConstraints: false
  })
  reminders?: ReminderEntity[];

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Plan\Event", mappedBy="event")
   */
  // protected $planEvent;
  @OneToOne(() => PlanEventEntity, (e) => e.event, {
    createForeignKeyConstraints: false
  })
  planEvent?: PlanEventEntity;

  // Missing from entity php
  // created_by: string;
  @Column({
    name: 'created_by',
    type: 'varchar',
    length: 255,
    nullable: true
  })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

// application/Entities/Event.php
// application/Entity/Event.php
