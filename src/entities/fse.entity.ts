import { Collection, Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum EnumFseMode {
  SESAM_VITALE = 'SV',
  DEGRADE = 'DEG',
  SESAM_SANS_VITALE = 'SSV',
  DESYNCHRONISEE = 'DES',
  PAPIER = 'PPR',
}

export enum EnumFseType {
  DRE = 'DRE',
  FSE = 'FSE',
  ENR = 'ENR',
  FDE = 'FDE',
  FSU = 'FSU',
}

/**
 * @ORM\Entity
 * @ORM\Table(name="T_FSE_FSE")
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 */
@Entity('T_FSE_FSE')
export class FseEntity {

  /**
   * @ORM\Column(name="FSE_ID", type="integer")
   * @ORM\Id
   * @ORM\GeneratedValue(strategy="IDENTITY")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'FSE_ID',
  })
  id?: number;

  /**
     * @ORM\ManyToOne(targetEntity="User", inversedBy="caresheets")
     * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
     */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="Patient")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @Serializer\Expose
   * @Serializer\Groups({"caresheet:index", "caresheet:read", "tiersPayant:index"})
   * @Serializer\MaxDepth(1)
   */
  // @TODO EntityMissing
  // protected $patient;

  /**
   * @ORM\ManyToOne(targetEntity="CaresheetStatus")
   * @ORM\JoinColumn(name="fse_status_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"caresheet:index", "caresheet:read"})
   */
  // @TODO EntityMissing
  // protected $fseStatus = null;

  /**
   * @ORM\ManyToOne(targetEntity="CaresheetStatus")
   * @ORM\JoinColumn(name="dre_status_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"caresheet:index", "caresheet:read"})
   */
  // @TODO EntityMissing
  // protected $dreStatus = null;

  /**
   * @ORM\ManyToOne(targetEntity="Amo")
   * @ORM\JoinColumn(name="amo_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  // protected $amo = null;

  /**
   * @ORM\ManyToOne(targetEntity="Amc")
   * @ORM\JoinColumn(name="amc_id", referencedColumnName="id", nullable=true)
   */
  // @TODO EntityMissing
  // protected $amc = null;

  /**
   * @ORM\Column(name="numero_facturation", type="string", length=9, nullable=true, options={"fixed": true})
   */
  @Column({
    name: 'numero_facturation',
    type: 'char',
    length: 9,
    nullable: true,
    default: null,
  })
  protected $numeroFacturation = null;

  /**
   * @ORM\Column(name="FSE_NBR", type="string", length=45)
   */
  @Column({
    name: 'FSE_NBR',
    type: 'varchar',
    length: 45,
    nullable: true,
    default: null,
  })
  nbr?: string;

  /**
   * @ORM\Column(name="FSE_DATE", type="date")
   */
  @Column({
    name: 'FSE_DATE',
    type: 'date',
  })
  date?: string;

  /**
     * @ORM\Column(name="mode", type="enum_caresheet_mode", length=3, options={"fixed": 3, "default": "SV"})
     * @Serializer\Expose
     * @Serializer\Groups({"caresheet:index", "caresheet:read"})
     * @Assert\Choice(callback={"App\Enum\CaresheetModeEnum", "getValues"})
     * @Assert\NotNull
     */
  @Column({
    name: 'mode',
    type: 'char',
    length: 3,
    default: EnumFseMode.SESAM_VITALE
  })
  mode?: EnumFseMode;

  /**
   * @ORM\Column(name="type", type="enum_caresheet_type", length=3, options={"fixed": 3, "default": "FSE"})
   * @Serializer\Expose
   * @Serializer\Groups({"caresheet:index", "caresheet:read"})
   * @Assert\Choice(callback={"App\Enum\CaresheetTypeEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'type',
    type: 'char',
    length: 3,
    default: EnumFseType.FSE
  })
  type?: EnumFseType;

  /**
     * @ORM\Column(name="electronic_caresheet", type="boolean", options={"default": true})
     * @Serializer\Expose
     * @Serializer\Groups({"caresheet:read"})
     * @Serializer\Type("bool")
     * @Assert\Type("bool")
     * @Assert\NotNull
     */
  @Column({
    name: 'electronic_caresheet',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  electronicCaresheet?: number;

  /**
     * @ORM\Column(name="tiers_payant", type="boolean", options={"default": false})
     * @Serializer\Expose
     * @Serializer\Type("boolean")
     * @Assert\Type("boolean")
     * @Assert\NotNull
     */
  @Column({
    name: 'tiers_payant',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  tiersPayant?: number;

  /**
   * @ORM\Column(name="tiers_payant_status", type="string", length=3, nullable=true, options={"fixed": true})
   * @Serializer\Expose
   * @Serializer\Groups({"tiersPayant:index"})
   * @Assert\Choice(callback={"App\Enum\ThirdPartyStatusEnum", "getValues"})
   */
  @Column({
    name: 'tiers_payant_status',
    type: 'char',
    length: 3,
    nullable: true,
    default: null,
  })
  tiersPayantStatus?: string;

  /**
    * @ORM\Column(name="FSE_AMOUNT", type="decimal", precision=10, scale=2, options={"default": 0})
    * @Serializer\Expose
    * @Serializer\Groups({"caresheet:index", "caresheet:read", "tiersPayant:index"})
    * @Serializer\Type("float")
    * @Assert\Type("float")
    * @Assert\NotNull
    */
  @Column({
    name: 'FSE_AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount?: number;

  /**
   * @ORM\Column(name="third_party_amount", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"tiersPayant:index"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'third_party_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  thirdPartyAmount?: number;

  /**
   * @ORM\Column(name="third_party_amount_paid", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"tiersPayant:index"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'third_party_amount_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  thirdPartyAmountPaid?: number;

  /**
   * @ORM\Column(name="FSE_AMOUNT_AMO", type="decimal", precision=10, scale=2)
   */
  @Column({
    name: 'FSE_AMOUNT_AMO',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountAMO?: number;

  /**
   * @ORM\Column(name="FSE_AMOUNT_AMC", type="decimal", precision=10, scale=2)
   */
  @Column({
    name: 'FSE_AMOUNT_AMC',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountAMC?: number;

  /**
   * @ORM\Column(name="FSE_AMOUNT_ASSURE", type="decimal", precision=10, scale=2)
   */
  @Column({
    name: 'FSE_AMOUNT_ASSURE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountAssure?: number;

  /**
   * @ORM\OneToMany(targetEntity="\App\Entities\Dental\Event\Task", mappedBy="fse")
   */
  // @TODO EntityMissing
  // protected $tasks;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\User")
   * @ORM\JoinColumn(name="USR_ID", referencedColumnName="USR_ID")
   * @var \App\Entities\User|NULL Référence l'utilisateur ayant crée la FSE
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="\App\Entities\Contact")
   * @ORM\JoinColumn(name="CON_ID", referencedColumnName="CON_ID")
   * @var \App\Entities\Contact|NULL Référence le patient à qui appartient la FSE
   */
  // @TODO EntityMissing
  // protected $contact;

  /**
     * @ORM\Column(name="external_reference_id", type="integer", nullable=true)
     * @Serializer\Expose
     * @Serializer\Type("int")
     * @Assert\Type("int")
     * @Assert\GreaterThan(0)
     */
  @Column({
    name: 'external_reference_id',
    type: 'int',
    width: 11,
    nullable: true,
    default: null,
  })
  externalReferenceId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

// application/Entities/Fse.php
