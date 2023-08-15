import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ContactEntity } from './contact.entity';
import { LibraryActEntity } from './library-act.entity';
import { LibraryActQuantityEntity } from './library-act-quantity.entity';
import { EventEntity } from './event.entity';
import { DentalEventTaskEntity } from './dental-event-task.entity';
import { TraceabilityEntity } from './traceability.entity';

/**
 * @ORM\Entity(repositoryClass="\App\Repositories\Prestation")
 * @ORM\Table(name="T_EVENT_TASK_ETK")
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
@Entity('T_EVENT_TASK_ETK')
export class EventTaskEntity {
  // use TimestampableTrait;
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  // use SoftDeleteableEntity;
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  /**
   * @ORM\Column(name="ETK_ID", type="integer", nullable=false)
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'ETK_ID',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @var \App\Entities\User Entité représentant le praticien.
   */
  //   protected $user;
  @Column({
    name: 'USR_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  usrId?: number;
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'USR_ID',
  })
  user?: UserEntity;

  /**
   *
   * @ORM\ManyToOne(targetEntity="Patient", inversedBy="acts")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   */
  //   protected $patient;
  @Column({
    name: 'CON_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  conId?: number;
  @ManyToOne(() => ContactEntity, (e) => e.acts, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'CON_ID',
  })
  patient?: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @var \App\Entities\Contact Entité représentant le patient.
   */
  //   protected $contact;
  // @ManyToOne(() => ContactEntity, {
  //   createForeignKeyConstraints: false,
  // })
  // @JoinColumn({
  //   name: 'CON_ID',
  // })
  // contact?: ContactEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\LibraryAct")
   * @ORM\JoinColumn(name="library_act_id", referencedColumnName="id", nullable=true)
   */
  //   protected $libraryAct = null;
  @Column({
    name: 'library_act_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  libraryActId?: number;
  @ManyToOne(() => LibraryActEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'library_act_id',
  })
  libraryAct?: LibraryActEntity;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\LibraryActQuantity")
   * @ORM\JoinColumn(name="library_act_quantity_id", referencedColumnName="id", nullable=true)
   */
  //   protected $libraryActQuantity = null;
  @Column({
    name: 'library_act_quantity_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  libraryActQuantityId?: number;
  @ManyToOne(() => LibraryActQuantityEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'library_act_quantity_id',
  })
  libraryActQuantity?: LibraryActQuantityEntity;

  /**
   *
   * @ORM\Column(name="ETK_NAME", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  // @Column({
  //   name: 'ETK_NAME',
  //   length: 255,
  //   type: 'varchar',
  // })
  // label?: string;

  /**
   * @ORM\Column(name="ETK_NAME", type="string", length=81, nullable=false)
   */
  @Column({
    name: 'ETK_NAME',
    length: 255,
    type: 'varchar',
  })
  name?: string;

  /**
   * @ORM\Column(name="ETK_DATE", type="date", nullable=true)
   * @var \DateTime|NULL Date de la prestation.
   */
  @Column({
    name: 'ETK_DATE',
    type: 'date',
    nullable: true,
  })
  date?: string;

  /**
   *
   * @ORM\Column(name="ETK_MSG", type="text", nullable=true)
   * @Serializer\Expose
   * @Assert\Type("string")
   */
  // @Column({
  //   name: 'ETK_MSG',
  //   type: 'text',
  //   nullable: true,
  // })
  // observation?: string;

  /**
   * @ORM\Column(name="ETK_MSG", type="text", nullable=true)
   */
  @Column({
    name: 'ETK_MSG',
    type: 'text',
    nullable: true,
  })
  msg?: string;

  /**
   *
   * @ORM\Column(name="ETK_POS", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'ETK_POS',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number;

  /**
   * @ORM\Column(name="ETK_POS", type="integer", nullable=false)
   */
  // @Column({
  //   name: 'ETK_POS',
  //   type: 'int',
  //   width: 11,
  //   default: 0,
  // })
  // pos?: number;

  /**
   * @ORM\Column(name="ETK_DURATION", type="time", nullable=false)
   */
  @Column({
    name: 'ETK_DURATION',
    type: 'time',
    default: '00:00:00',
  })
  duration?: string;

  /**
   * @ORM\Column(name="ETK_AMOUNT", type="float", nullable=false)
   */
  @Column({
    name: 'ETK_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amount?: number;

  /**
   *
   * @ORM\Column(name="ETK_AMOUNT_SAVED", type="decimal", precision=10, scale=2, nullable=true)
   * @Serializer\Type("float")
   * @Assert\Type("float")
   */
  @Column({
    name: 'ETK_AMOUNT_SAVED',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amountBackup?: number;

  /**
   * @ORM\Column(name="ETK_AMOUNT_SAVED", type="float", nullable=true)
   * @var float Montant sauvegardé suite à la suppression d'une feuille
   * de soin électronique.
   */
  // @Column({
  //   name: 'ETK_AMOUNT_SAVED',
  //   type: 'decimal',
  //   precision: 10,
  //   scale: 2,
  //   nullable: true,
  // })
  // amountSaved?: number;

  /**
   * @ORM\Column(name="ETK_COLOR", type="integer", nullable=false)
   */
  @Column({
    name: 'ETK_COLOR',
    type: 'int',
    width: 11,
    default: 0,
  })
  color?: number;

  /**
   * @ORM\Column(name="ETK_QTY", type="integer", nullable=false)
   */
  @Column({
    name: 'ETK_QTY',
    type: 'int',
    width: 11,
    default: 1,
  })
  qty?: number;

  /**
   *
   * @ORM\Column(name="ETK_STATE", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'ETK_STATE',
    type: 'int',
    width: 11,
    default: 0,
  })
  status?: number;

  /**
   * @ORM\Column(name="ETK_STATE", type="integer")
   */
  // @Column({
  //   name: 'ETK_STATE',
  //   type: 'int',
  //   width: 11,
  //   default: 0,
  // })
  // state?: number;

  /**
   * @ORM\Column(name="ccam_family", type="string", length=3, nullable=true)
   * @var string Code de regroupement CCAM.
   */

  @Column({
    name: 'ccam_family',
    length: 3,
    type: 'varchar',
    nullable: true,
  })
  ccamFamily?: string;

  /**
   *
   * @ORM\Column(name="traceability_status", type="traceabilityStatusEnum", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Choice(callback={"App\Enum\TraceabilityStatusEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'traceability_status',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  traceabilityStatus?: number;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Event", inversedBy="tasks")
   * @ORM\JoinColumn(name="EVT_ID", referencedColumnName="EVT_ID")
   */
  //   protected $event;
  @Column({
    name: 'EVT_ID',
    type: 'int',
    width: 11,
    nullable: true,
  })
  evtId?: number;
  @ManyToOne(() => EventEntity, (e) => e.tasks, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'EVT_ID',
  })
  event?: EventEntity;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Dental\Event\Task", mappedBy="task")
   */
  //   protected $dental;
  @OneToOne(() => DentalEventTaskEntity, (e) => e.task, {
    createForeignKeyConstraints: false,
  })
  dental?: DentalEventTaskEntity;

  /**
   * @ORM\ManyToOne(targetEntity="Act")
   * @ORM\JoinColumn(name="parent_id", referencedColumnName="ETK_ID", nullable=true)
   */
  //   protected $parent = null;
  @Column({
    name: 'parent_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  parentId?: number;
  @ManyToOne(() => EventTaskEntity, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({
    name: 'parent_id',
  })
  parent?: EventTaskEntity;

  /**
   * @ORM\OneToOne(targetEntity="ActMedical", mappedBy="act", fetch="EAGER", cascade={"persist"})
   * @Serializer\Expose
   */
  //   protected $medical = null;
  @OneToOne(() => DentalEventTaskEntity, (e) => e.act, {
    createForeignKeyConstraints: false,
  })
  medical?: DentalEventTaskEntity;

  /**
   * @ORM\OneToMany(targetEntity="Traceability", mappedBy="act", cascade={"persist"}, orphanRemoval=true)
   */
  //   protected $traceabilities;
  @OneToMany(() => TraceabilityEntity, (e) => e.act, {
    createForeignKeyConstraints: false,
  })
  traceabilities?: TraceabilityEntity[];
}

//application\Entities\Event\Task.php
//application\Entity\Act.php
