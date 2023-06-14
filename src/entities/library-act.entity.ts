import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LibraryActFamilyEntity } from './library-act-family.entity';
import { LibraryActQuantityEntity } from './library-act-quantity.entity';
import { LibraryOdontogramEntity } from './library-odontogram.entity';
import { LibraryActAssociationEntity } from './library-act-association.entity';
import { LibraryActComplementaryEntity } from './library-act-complementary.entity';
import { TraceabilityEntity } from './traceability.entity';
import { LettersEntity } from './letters.entity';
import { OrganizationEntity } from './organization.entity';

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
  //   protected $family;

  @Column({
    name: 'library_act_family_id',
    type: 'int',
    width: 11
  })
  libraryActFamilyId?: number;
  @ManyToOne(() => LibraryActFamilyEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'library_act_family_id'
  })
  family?: LibraryActFamilyEntity;

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
    name: 'descriptive_text',
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
  position?: number;

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
  traceabilityActivated?: number;

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
  //   protected $quantities;

  @OneToMany(() => LibraryActQuantityEntity, e => e.act, {
    createForeignKeyConstraints: false
  })
  quantities?: LibraryActQuantityEntity[];

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
  //   protected $odontograms;

  @ManyToMany(() => LibraryOdontogramEntity)
  @JoinTable({
    name: 'library_act_odontogram',
    joinColumn: {
      name: 'library_act_id',
    },
    inverseJoinColumn: {
      name: 'library_odontogram_id',
    },
  })
  odontograms?: LibraryOdontogramEntity[];

  /**
   * @ORM\OneToMany(targetEntity="LibraryActAssociation", mappedBy="parent", cascade={"persist"}, orphanRemoval=true)
   * @ORM\OrderBy({"position": "ASC"})
   * @Serializer\Expose
   * @Serializer\Groups({"associations_group"})
   */
  //   protected $associations;

  @OneToMany(() => LibraryActAssociationEntity, e => e.parent, {
    createForeignKeyConstraints: false
  })
  associations?: LibraryActAssociationEntity[];

  /**
   * @ORM\OneToMany(targetEntity="LibraryActAssociation", mappedBy="child", cascade={"persist"}, orphanRemoval=true)
   */
  // protected $associatedWithMe;

  @OneToMany(() => LibraryActAssociationEntity, e => e.child, {
    createForeignKeyConstraints: false
  })
  associatedWithMe?: LibraryActAssociationEntity[];

  /**
   * @ORM\OneToMany(targetEntity="LibraryActComplementary", mappedBy="parent", cascade={"persist"}, orphanRemoval=true)
   * @ORM\OrderBy({"position": "ASC"})
   * @Serializer\Expose
   * @Serializer\Groups({"associations_group"})
   */
  //   protected $complementaries;

  @OneToMany(() => LibraryActComplementaryEntity, e => e.parent, {
    createForeignKeyConstraints: false
  })
  complementaries?: LibraryActComplementaryEntity[];

  /**
   * @ORM\OneToMany(targetEntity="LibraryActComplementary", mappedBy="child", cascade={"persist"}, orphanRemoval=true)
   */
  // protected $complementariesWithMe;

  @OneToMany(() => LibraryActComplementaryEntity, e => e.child, {
    createForeignKeyConstraints: false
  })
  complementariesWithMe?: LibraryActComplementaryEntity[];

  /**
   * @ORM\OneToMany(targetEntity="Traceability", mappedBy="libraryAct", cascade={"persist"}, orphanRemoval=true)
   * @Serializer\Expose
   * @Serializer\Groups({"traceability:read"})
   */
  // protected $traceabilities;

  @OneToMany(() => TraceabilityEntity, e => e.libraryAct, {
    createForeignKeyConstraints: false
  })
  traceabilities?: TraceabilityEntity[];

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
  attachmentCount?: number;

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
   */
  // protected $attachments;

  @ManyToMany(() => LettersEntity)
  @JoinTable({
    name: 'library_act_attachment',
    joinColumn: {
      name: 'library_act_id',
    },
    inverseJoinColumn: {
      name: 'mail_id',
    },
  })
  attachments?: LettersEntity[];

  /**
   * @ORM\ManyToOne(targetEntity="Organization")
   * @ORM\JoinColumn(name="organization_id", referencedColumnName="GRP_ID")
   */
  // protected $organization;

  @Column({
    name: 'organization_id',
    type: 'int',
    width: 11
  })
  organizationId?: number;
  @ManyToOne(() => OrganizationEntity, {
    createForeignKeyConstraints: false
  })
  @JoinColumn({
    name: 'organization_id'
  })
  organization?: OrganizationEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
// application/Entities/LibraryAct.php
// application/Entity/LibraryAct.php
