import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

/**
 * @ORM\Entity(repositoryClass="App\Repository\PeriodontalChartRepository")
 * @ORM\Table(name="periodontal_chart")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('periodontal_chart')
export class PeriodontalChartEntity {

  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // protected $organization;

  /**
   * @ORM\Id
   * @ORM\GeneratedValue
   * @ORM\Column(name="id", type="integer")
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:index", "periodontalChart:read"})
   * @Serializer\Type("int")
   */
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
  })
  id?: number;

  /**
   * @ORM\ManyToOne(targetEntity="User")
   * @ORM\JoinColumn(name="user_id", referencedColumnName="USR_ID")
   */
  // @TODO EntityMissing
  // protected $user;

  /**
   * @ORM\ManyToOne(targetEntity="Patient", inversedBy="periodontalCharts")
   * @ORM\JoinColumn(name="patient_id", referencedColumnName="CON_ID")
   */
  // @TODO EntityMissing
  // protected $patient;

  /**
   * @ORM\Column(name="creation_date", type="date")
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:index", "periodontalChart:read"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotNull
   */
  @Column({
    name: 'creation_date',
    type: 'date',
  })
  creationDate?: string;

  /**
   * @ORM\Column(name="status", type="periodontalStatusEnum", options={"default": 1})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:index", "periodontalChart:read"})
   * @Assert\Choice(callback={"App\Enum\PeriodontalStatusEnum", "getValues"})
   * @Assert\NotNull
   */
  @Column({
    name: 'status',
    type: 'int',
    default: 1
  })
  status?: number;

  /**
   * @ORM\Column(name="probing_depth", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'probing_depth',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  probingDepth?: number;

  /**
   * @ORM\Column(name="gingival_margin", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'gingival_margin',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  gingivalMargin?: number;

  /**
   * @ORM\Column(name="plaque", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'plaque',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  plaque?: number;

  /**
   * @ORM\Column(name="bleeding_on_probing", type="decimal", precision=10, scale=2, options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Serializer\Type("float")
   * @Assert\Type("float")
   * @Assert\NotNull
   */
  @Column({
    name: 'bleeding_on_probing',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0.00
  })
  bleedingOnProbing?: number;

  /**
   * @ORM\Column(name="matrix", type="json")
   * @Serializer\Expose
   * @Serializer\Groups({"periodontalChart:read"})
   * @Assert\Type("array")
   * @Assert\NotBlank
   */
  @Column({
    name: 'matrix',
    type: 'json',
    nullable: false
  })
  matrix?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;
  
}

//application/Entity/PeriodontalChart.php