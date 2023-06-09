import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * @ORM\Entity(repositoryClass="App\Repositories\CcamRepository")
 * @ORM\Table(name="ccam")
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('ccam')
export class CcamEntity {
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
   * @ORM\ManyToOne(targetEntity="App\Entity\CcamFamily", fetch="EAGER")
   * @ORM\JoinColumn(name="ccam_family_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   */
  // @TODO EntityMissing
  //   protected $family;

  /**
   * @ORM\Column(name="code", type="string", length=7, unique=true)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Regex("/^[A-Z]{4}\d{3}$/")
   */
  @Column({
    name: 'code',
    type: 'varchar',
    length: 7,
    unique: true,
  })
  code?: string;

  /**
   * @ORM\Column(name="name", type="string", length=4000)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(
   *  max=4000
   * )
   */
  @Column({
    name: 'name',
    type: 'varchar',
    length: 4000,
  })
  name?: string;

  /**
   * @ORM\Column(name="short_name", type="string", length=70, nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\Length(
   *  max=70
   * )
   */
  @Column({
    name: 'short_name',
    type: 'varchar',
    length: 70,
    nullable: true,
  })
  shortName?: string;

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
   * @ORM\Column(name="activity", type="integer", options={"default": 1})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'activity',
    type: 'int',
    width: 11,
    default: 1,
  })
  activity?: number;

  /**
   * @ORM\Column(name="phase", type="integer", options={"default": 0})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'phase',
    type: 'int',
    width: 11,
    default: 0,
  })
  phase?: number;

  /**
   * @ORM\Column(name="opposable", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */

  @Column({
    name: 'opposable',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  opposable?: number;

  /**
   * @ORM\Column(name="modifiers", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'modifiers',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  modifiers?: number;

  /**
   * @ORM\Column(name="repayable_on_condition", type="boolean", options={"default": false})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Serializer\Type("bool")
   * @Assert\Type("bool")
   * @Assert\NotNull
   */
  @Column({
    name: 'repayable_on_condition',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  repayableOnCondition?: number;

  /**
   * @ORM\Column(name="number_of_teeth", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
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
  numberOfTeeth?: number;

  /**
   * @ORM\Column(name="age_min", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'age_min',
    type: 'int',
    width: 11,
    default: 0,
  })
  ageMin?: number;

  /**
   * @ORM\Column(name="age_max", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(
   *  propertyPath="ageMin"
   * )
   */
  @Column({
    name: 'age_max',
    type: 'int',
    width: 11,
    default: 0,
  })
  ageMax?: number;

  /**
   * @ORM\Column(name="created_on", type="date")
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   * @Assert\NotNull
   */
  @Column({
    name: 'created_on',
    type: 'date',
  })
  createdOn?: number;

  /**
   * @ORM\Column(name="deleted_on", type="date", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("DateTime<'Y-m-d'>")
   * @Assert\Date
   */
  @Column({
    name: 'deleted_on',
    type: 'date',
    nullable: true,
  })
  deletedOn?: number;

  /**
   * @ORM\OneToMany(targetEntity="CcamCondition", mappedBy="ccam", cascade={"persist"}, orphanRemoval=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Valid
   */
  // @TODO EntityMissing
  //   protected $conditions;

  /**
   * @ORM\OneToMany(targetEntity="CcamUnitPrice", mappedBy="ccam", cascade={"persist"})
   * @ORM\OrderBy({"createdOn" = "DESC"})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Valid
   */
  // @TODO EntityMissing
  //   protected $unitPrices;

  /**
   * @ORM\ManyToMany(targetEntity="Ccam", mappedBy="associations")
   */
  // @TODO EntityMissing
  //   protected $associatedWithMe;

  /**
   * @ORM\ManyToMany(targetEntity="Ccam", inversedBy="associatedWithMe")
   * @ORM\JoinTable(name="ccam_association",
   *  joinColumns={@ORM\JoinColumn(name="ccam_parent_id", referencedColumnName="id")},
   *  inverseJoinColumns={@ORM\JoinColumn(name="ccam_child_id", referencedColumnName="id")}
   * )
   */
  // @TODO EntityMissing
  //   protected $associations;

  /**
   * @ORM\ManyToMany(targetEntity="Ccam")
   * @ORM\JoinTable(name="ccam_dependence",
   *  joinColumns={@ORM\JoinColumn(name="ccam_parent_id", referencedColumnName="id")},
   *  inverseJoinColumns={@ORM\JoinColumn(name="ccam_child_id", referencedColumnName="id")}
   * )
   */
  // @TODO EntityMissing
  //   protected $dependences;

  /**
   * @ORM\ManyToOne(targetEntity="DentalMaterial")
   * @ORM\JoinColumn(name="dental_material_id", referencedColumnName="id", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   */
  // @TODO EntityMissing
  // protected $material = NULL;

  /**
   * @ORM\Column(name="forbidden_teeth", type="simple_array", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Type("array")
   */
  @Column({
    name: 'forbidden_teeth',
    type: 'varchar',
    nullable: true,
    length: 255,
  })
  forbiddenTeeth?: string;

  /**
   * @ORM\ManyToMany(targetEntity="Ccam")
   * @ORM\JoinTable(
   *  name="ccam_association",
   *  joinColumns={
   *      @ORM\JoinColumn(name="ccam_parent_id", referencedColumnName="id")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="ccam_child_id", referencedColumnName="id")
   *  }
   * )
   */
  // @TODO EntityMissing
  // protected $associations;

  /**
   * @ORM\ManyToMany(targetEntity="Ccam")
   * @ORM\JoinTable(
   *  name="ccam_association",
   *  joinColumns={
   *      @ORM\JoinColumn(name="ccam_parent_id", referencedColumnName="id")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="ccam_child_id", referencedColumnName="id")
   *  }
   * )
   */
  // @TODO EntityMissing
  // protected $associations;

  /**
   * @ORM\ManyToMany(targetEntity="Ccam", inversedBy="dependentWithMe")
   * @ORM\JoinTable(
   *  name="ccam_dependence",
   *  joinColumns={
   *      @ORM\JoinColumn(name="ccam_parent_id", referencedColumnName="id")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="ccam_child_id", referencedColumnName="id")
   *  }
   * )
   */
  // @TODO EntityMissing
  // protected $dependencies;

  /**
   * @ORM\ManyToMany(targetEntity="Ccam", mappedBy="dependencies")
   */
  // @TODO EntityMissing
  // protected $dependentWithMe;

  /**
   * @ORM\OneToMany(targetEntity="CcamCmuCodification", mappedBy="ccam")
   */
  // @TODO EntityMissing
  // protected $cmuCodifications;

  /**
   * @ORM\OneToMany(targetEntity="CcamTooth", mappedBy="ccam")
   * @ORM\OrderBy({"rank": "ASC"})
   */
  // @TODO EntityMissing
  // protected $teeth;

  /**
   * @ORM\OneToMany(targetEntity="DomtomMajoration", mappedBy="ccam")
   */
  // @TODO EntityMissing
  // protected $domtomMajorations;
}

// application\Entities\Ccam.php
// application\Entity\Ccam.php
