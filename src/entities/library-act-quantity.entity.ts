import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EnumLibraryActQuantityExceeding {
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  N = 'N',
  A = 'A',
  M = 'M',
  B = 'B',
  C = 'C',
}

/**
 * @ORM\Entity(repositoryClass="App\Repositories\LibraryActQuantityRepository")
 * @ORM\Table(name="library_act_quantity", uniqueConstraints={
 *  @ORM\UniqueConstraint(columns={"organization_id", "internal_reference_id"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */
Entity('library_act_quantity');
export class LibraryActQuantityEntity {
  // use OrganizationTrait;
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // protected $organization;

  // use TimestampableTrait;
  // use SoftDeleteableEntity;
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryAct", inversedBy="quantities")
   * @ORM\JoinColumn(name="library_act_id", referencedColumnName="id")
   */
  // @TODO EntityMissing
  //   protected $act;

  /**
   * @ORM\ManyToOne(targetEntity="Ccam")
   * @ORM\JoinColumn(name="ccam_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   */
  // @TODO EntityMissing
  //   protected $ccam = null;

  /**
   * @ORM\ManyToOne(targetEntity="NgapKey")
   * @ORM\JoinColumn(name="ngap_key_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   */
  // @TODO EntityMissing
  //   protected $ngapKey = null;

  /**
   * @ORM\Column(name="label", type="string", length=4000)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(
   *  max=4000
   * )
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 4000,
  })
  label?: string;

  /**
   * @ORM\Column(name="observation", type="text", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("string")
   */
  @Column({
    name: 'observation',
    type: 'text',
    nullable: true,
  })
  observation?: string;

  /**
   * @ORM\Column(type="string", length=1000, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Length(max=1000)
   */
  @Column({
    name: 'descriptive_text',
    type: 'varchar',
    length: 1000,
  })
  descriptiveText?: string;

  /**
   * @ORM\Column(name="number_of_teeth", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'number_of_teeth',
    type: 'int',
    width: 11,
    default: 0,
  })
  numberOfTeeth?: string;

  /**
   * @ORM\Column(name="amount", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("numeric")
   * @Assert\NotNull
   */
  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount?: number;

  /**
   * @ORM\Column(name="coefficient", type="decimal", precision=10, scale=2, options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("numeric")
   * @Assert\NotNull
   * @Assert\GreaterThan(0)
   */
  @Column({
    name: 'coefficient',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1,
  })
  coefficient?: number;

  /**
   * @ORM\Column(name="exceeding", type="enum_exceeding", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Choice(callback={"App\Enum\ExceedingEnum", "getValues"})
   */
  @Column({
    name: 'exceeding',
    type: 'enum',
    enum: EnumLibraryActQuantityExceeding,
    nullable: true,
  })
  exceeding?: EnumLibraryActQuantityExceeding;

  /**
   * @ORM\Column(name="duration", type="time", options={"default": "00:00:00"})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("DateTime<'H:i:s'>")
   * @Assert\Type("DateTimeInterface")
   * @Assert\NotNull
   */
  @Column({
    name: 'duration',
    type: 'time',
    default: '00:00:00',
  })
  duration?: string;

  /**
   * @ORM\Column(name="buying_price", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("float")
   * @Assert\Type("numeric")
   * @Assert\NotNull
   */
  @Column({
    name: 'buying_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  buyingPrice?: number;

  /**
   * @ORM\Column(name="materials", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'materials',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  materials?: string;

  /**
   * @ORM\Column(name="traceability_activated", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'traceability_activated',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  traceabilityActivated?: number;

  /**
   * @ORM\Column(name="traceability_merged", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'traceability_merged',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  traceabilityMerged?: number;

  /**
   * @ORM\Column(name="transmitted", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'transmitted',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  transmitted?: number;

  /**
   * @ORM\Column(name="used", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'used',
    type: 'tinyint',
    width: 1,
    default: 1,
  })
  used?: number;

  /**
   * @ORM\Column(name="internal_reference_id", type="integer", nullable=true)
   */
  @Column({
    name: 'internal_reference_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  internalReferenceId?: number;

  /**
   * @ORM\ManyToMany(targetEntity="LibraryOdontogram", inversedBy="libraryActQuantities", cascade={"persist"})
   * @ORM\OrderBy({"rankOfTooth" = "ASC"})
   * @ORM\JoinTable(name="library_act_quantity_odontogram",
   *  joinColumns={@ORM\JoinColumn(name="library_act_quantity_id", referencedColumnName="id")},
   *  inverseJoinColumns={@ORM\JoinColumn(name="library_odontogram_id", referencedColumnName="id")}
   * )
   * @Serializer\Expose
   * @Serializer\Groups({"odontograms_group"})
   */
  // @TODO EntityMissing
  //   protected $odontograms;

  /**
   * @ORM\OneToMany(targetEntity="LibraryActQuantityTariff", mappedBy="libraryActQuantity", cascade={"persist"}, orphanRemoval=true)
   * @Serializer\Expose
   * @Serializer\Groups({"libraryActQuantity:read"})
   */
  // @TODO EntityMissing
  //   protected $tariffs;

  /**
   * @ORM\OneToMany(targetEntity="Traceability", mappedBy="libraryActQuantity", cascade={"persist"}, orphanRemoval=true)
   * @Serializer\Expose
   * @Serializer\Groups({"traceability:read"})
   */
  // @TODO EntityMissing
  //   protected $traceabilities;

  /**
   * @ORM\ManyToOne(targetEntity="LibraryAct", inversedBy="quantities")
   * @ORM\JoinColumn(name="library_act_id", referencedColumnName="id")
   */
  //@TODO EntityMissing;
  // protected $act;

  /**
   * @ORM\ManyToOne(targetEntity="Ccam")
   * @ORM\JoinColumn(name="ccam_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   */
  //@TODO EntityMissing;
  // protected $ccam = null;

  /**
   * @ORM\ManyToOne(targetEntity="NgapKey")
   * @ORM\JoinColumn(name="ngap_key_id", referencedColumnName="id", nullable=true)
   */
  //@TODO EntityMissing;
  // protected $ngapKey = null;

  /**
   * @ORM\OneToMany(targetEntity="LibraryActQuantityTariff", mappedBy="libraryActQuantity")
   * @Serializer\Expose
   * @Serializer\Groups({"libraryActQuantity:read"})
   */
  //@TODO EntityMissing;
  // protected $tariffs;

  /**
   * @ORM\OneToMany(targetEntity="Traceability", mappedBy="libraryActQuantity", cascade={"persist"}, orphanRemoval=true)
   * @Serializer\Expose
   * @Serializer\Groups({"traceability:read"})
   */
  //@TODO EntityMissing;
  // protected $traceabilities;
}

// application\Entities\LibraryActQuantity.php
// application\Entity\LibraryActQuantity.php
