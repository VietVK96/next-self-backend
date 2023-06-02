import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  // @TODO EntityMissing
  //   protected $user;

  /**
   * // @Check VariableMissing
   * @ORM\ManyToOne(targetEntity="Patient", inversedBy="acts")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   */

  //   protected $patient;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @var \App\Entities\Contact Entité représentant le patient.
   */
  // @TODO EntityMissing
  //   protected $contact;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\LibraryAct")
   * @ORM\JoinColumn(name="library_act_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  //   protected $libraryAct = null;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\LibraryActQuantity")
   * @ORM\JoinColumn(name="library_act_quantity_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  //   protected $libraryActQuantity = null;

  /**
   * // @Check VariableMissing
   * @ORM\Column(name="ETK_NAME", type="string", length=255)
   * @Serializer\Expose
   * @Assert\Type("string")
   * @Assert\NotBlank
   */
  //protected $label;

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
   * // @Check VariableMissing
   * @ORM\Column(name="ETK_MSG", type="text", nullable=true)
   * @Serializer\Expose
   * @Assert\Type("string")
   */
  //protected $observation = null;

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
   * // @Check VariableMissing
   * @ORM\Column(name="ETK_POS", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  //protected $position = 0;

  /**
   * @ORM\Column(name="ETK_POS", type="integer", nullable=false)
   */
  @Column({
    name: 'ETK_POS',
    type: 'int',
    width: 11,
    default: 0,
  })
  pos?: number;

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
   * // @Check VariableMissing
   * @ORM\Column(name="ETK_AMOUNT_SAVED", type="decimal", precision=10, scale=2, nullable=true)
   * @Serializer\Type("float")
   * @Assert\Type("float")
   */
  //protected $amountBackup = null;

  /**
   * @ORM\Column(name="ETK_AMOUNT_SAVED", type="float", nullable=true)
   * @var float Montant sauvegardé suite à la suppression d'une feuille
   * de soin électronique.
   */
  @Column({
    name: 'ETK_AMOUNT_SAVED',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amountSaved?: number;

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
   * // @Check VariableMissing
   * @ORM\Column(name="ETK_STATE", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  //protected $status = 0;

  /**
   * @ORM\Column(name="ETK_STATE", type="integer")
   */
  @Column({
    name: 'ETK_STATE',
    type: 'int',
    width: 11,
    default: 0,
  })
  state?: number;

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
   * // @Check VariableMissing
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
  // protected $traceabilityStatus = TraceabilityStatusEnum:: NONE;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Event", inversedBy="tasks")
   * @ORM\JoinColumn(name="EVT_ID", referencedColumnName="EVT_ID")
   */
  // @TODO EntityMissing
  //   protected $event;

  /**
   * @ORM\OneToOne(targetEntity="\App\Entities\Dental\Event\Task", mappedBy="task")
   */
  // @TODO EntityMissing
  //   protected $dental;

  /**
   * @ORM\ManyToOne(targetEntity="Act")
   * @ORM\JoinColumn(name="parent_id", referencedColumnName="ETK_ID", nullable=true)
   */
  // @TODO EntityMissing
  //   protected $parent = null;

  /**
   * @ORM\OneToOne(targetEntity="ActMedical", mappedBy="act", fetch="EAGER", cascade={"persist"})
   * @Serializer\Expose
   */
  // @TODO EntityMissing
  //   protected $medical = null;

  /**
   * @ORM\OneToMany(targetEntity="Traceability", mappedBy="act", cascade={"persist"}, orphanRemoval=true)
   */
  // @TODO EntityMissing
  //   protected $traceabilities;
}

//application\Entities\Event\Task.php
//application\Entity\Act.php
