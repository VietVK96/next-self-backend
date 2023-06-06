import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EnumLibraryActNomenclature {
  NGAP = 'NGAP',
  CCAM = 'CCAM',
}
/**
 * @ORM\Entity(repositoryClass="App\Repositories\LibraryActRepository")
 * @ORM\Table(name="library_act", uniqueConstraints={
 *  @ORM\UniqueConstraint(columns={"organization_id", "internal_reference_id"})
 * })
 * @ORM\HasLifecycleCallbacks
 * @Gedmo\SoftDeleteable(fieldName="deletedAt", timeAware=false)
 * @Serializer\ExclusionPolicy("all")
 */
@Entity('library_act')
export class LibraryActEntity {
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
   * @ORM\ManyToOne(targetEntity="LibraryActFamily", inversedBy="acts")
   * @ORM\JoinColumn(name="library_act_family_id", referencedColumnName="id")
   * @Serializer\Expose
   * @Serializer\Groups({"family_group", "detail"})
   * @Serializer\MaxDepth(1)
   */
  // @TODO EntityMissing
  //   protected $family;

  /**
   * @ORM\Column(name="label", type="string", length=255)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("string")
   * @Assert\NotBlank
   * @Assert\Length(
   *  max=255
   * )
   */
  @Column({
    name: 'label',
    type: 'varchar',
    length: 255,
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
    name: 'descriptive-text',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  descriptiveText?: string;

  /**
   * @ORM\Column(name="position", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'position',
    type: 'int',
    width: 11,
    default: 0,
  })
  position?: number = 0;

  /**
   * @ORM\Column(name="nomenclature", type="enum_nomenclature", nullable=true, options={"default": "CCAM"})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Choice(callback={"App\Enum\NomenclatureEnum", "getValues"})
   */
  @Column({
    name: 'nomenclature',
    type: 'enum',
    enum: EnumLibraryActNomenclature,
    default: EnumLibraryActNomenclature.CCAM,
    nullable: true,
  })
  nomenclature?: EnumLibraryActNomenclature;

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
  traceabilityActivated?: number = 0;

  /**
   * @ORM\Column(name="transmitted", type="boolean", options={"default": true})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
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
  transmitted?: number = 1;

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
  used?: number = 1;

  /**
   * @ORM\Column(name="internal_reference_id", type="integer", nullable=true)
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   */
  @Column({
    name: 'internal_reference_id',
    type: 'int',
    width: 11,
    nullable: true,
  })
  internalReferenceId?: number;

  /**
   * @ORM\OneToMany(targetEntity="LibraryActQuantity", mappedBy="act", cascade={"persist"}, orphanRemoval=true)
   * @ORM\OrderBy({"numberOfTeeth" = "ASC", "id" = "ASC"})
   * @Serializer\Expose
   * @Serializer\Groups({"detail"})
   * @Assert\Valid
   */
  // @TODO EntityMissing
  //   protected $quantities;

  /**
   * @ORM\ManyToMany(targetEntity="LibraryOdontogram", inversedBy="libraryActs", cascade={"persist"})
   * @ORM\OrderBy({"rankOfTooth" = "ASC"})
   * @ORM\JoinTable(name="library_act_odontogram",
   *  joinColumns={@ORM\JoinColumn(name="library_act_id", referencedColumnName="id")},
   *  inverseJoinColumns={@ORM\JoinColumn(name="library_odontogram_id", referencedColumnName="id")}
   * )
   * @Serializer\Expose
   * @Serializer\Groups({"odontograms_group"})
   */
  // @TODO EntityMissing
  //   protected $odontograms;

  /**
   * @ORM\OneToMany(targetEntity="LibraryActAssociation", mappedBy="parent", cascade={"persist"}, orphanRemoval=true)
   * @ORM\OrderBy({"position": "ASC"})
   * @Serializer\Expose
   * @Serializer\Groups({"associations_group"})
   */
  // @TODO EntityMissing
  //   protected $associations;

  /**
   * @ORM\OneToMany(targetEntity="LibraryActAssociation", mappedBy="child", cascade={"persist"}, orphanRemoval=true)
   */
  // @TODO EntityMissing
  //   protected $associatedWithMe;

  /**
   * @ORM\OneToMany(targetEntity="LibraryActComplementary", mappedBy="parent", cascade={"persist"}, orphanRemoval=true)
   * @ORM\OrderBy({"position": "ASC"})
   * @Serializer\Expose
   * @Serializer\Groups({"associations_group"})
   */
  // @TODO EntityMissing
  //   protected $complementaries;

  /**
   * @ORM\OneToMany(targetEntity="LibraryActComplementary", mappedBy="child", cascade={"persist"}, orphanRemoval=true)
   */
  // @TODO EntityMissing
  //   protected $complementariesWithMe;

  /**
   * @ORM\OneToMany(targetEntity="Traceability", mappedBy="libraryAct", cascade={"persist"}, orphanRemoval=true)
   * @Serializer\Expose
   * @Serializer\Groups({"traceability:read"})
   */
  // @TODO EntityMissing
  //   protected $traceabilities;

  /**
   * @ORM\Column(name="attachment_count", type="integer", options={"default": 0})
   * @Serializer\Expose
   * @Serializer\Groups({"list", "detail"})
   * @Serializer\Type("int")
   * @Assert\Type("int")
   * @Assert\NotNull
   * @Assert\GreaterThanOrEqual(0)
   */
  @Column({
    name: 'attachment_count',
    type: 'int',
    width: 11,
    default: 0,
  })
  attachmentCount?: number = 0;

  /**
   * @ORM\ManyToMany(targetEntity="App\Entity\Mail", cascade={"persist", "remove"})
   * @ORM\JoinTable(
   *  name="library_act_attachment",
   *  joinColumns={
   *      @ORM\JoinColumn(name="library_act_id", referencedColumnName="id")
   *  },
   *  inverseJoinColumns={
   *      @ORM\JoinColumn(name="mail_id", referencedColumnName="LET_ID")
   *  }
   * )
   * @Serializer\Expose
   * @Serializer\Groups({"attachment:read"})
   */ // @TODO EntityMissing
  // protected $attachments;
  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // @TODO EntityMissing
  // protected $organization;
  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entities/LibraryAct.php
